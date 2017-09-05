'use strict';

const Promise = require('promise');
const uuid = require('uuid/v4');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const blobStorageClient = require('../../clients/storage/BlobStorageClient');
const { withRunTime, limitForInClause } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const apiUrlBase = process.env.FORTIS_CENTRAL_ASSETS_HOST || 'https://fortiscentral.blob.core.windows.net';
const STREAM_PIPELINE_TWITTER = 'twitter';
const STREAM_CONNECTOR_TWITTER = 'Twitter';

const TRUSTED_SOURCES_CONNECTOR_TWITTER = 'Twitter';
const TRUSTED_SOURCES_CONNECTOR_FACEBOOK = 'FacebookPage';
const TRUSTED_SOURCES_RANK_DEFAULT = 10;

function createOrReplaceSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    return reject(
      'This API call is no longer supported. ' +
      'Its functionality has been separated into createSite and removeSite.'
    );
  });
}

function _insertTopics(siteType) {
  return new Promise((resolve, reject) => {
    if (!siteType || !siteType.length) return reject('insertTopics: siteType is not defined');

    const uri = `${apiUrlBase}/settings/siteTypes/${siteType}/topics/defaultTopics.json`;
    let mutations = [];
    blobStorageClient.fetchJson(uri)
    .then(response => {
      return response.map(topic => ({
        query: `INSERT INTO fortis.watchlist (topicid,topic,lang_code,translations,insertiontime) 
                VALUES (?, ?, ?, ?, toTimestamp(now()));`,
        params: [uuid(), topic.topic, topic.lang_code, topic.translations]
      }));
    })
    .then(response => {
      mutations = response;
      return cassandraConnector.executeBatchMutations(response);
    })
    .then(() => {
      resolve({
        numTopicsInserted: mutations.length
      });
    })
    .catch(reject);
  });
}

const insertTopics = trackEvent(_insertTopics, 'Settings.Topics.Insert', (response, err) => ({numTopicsInserted: err ? 0 : response.numTopicsInserted}));

/**
 * @param {{input: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], supportedLanguages: string[]}}} args
 * @returns {Promise}
 */
function editSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const siteName = args && args.input && args.input.name;
    if (!siteName || !siteName.length) return reject('sitename is not defined');

    cassandraConnector.executeQuery('SELECT * FROM fortis.sitesettings WHERE sitename = ?;', [siteName])
    .then(rows => {
      if (rows.length !== 1) return reject(`Site with sitename ${siteName} does not exist.`);
    })
    .then(() => {
      return cassandraConnector.executeBatchMutations([{
        query: `INSERT INTO fortis.sitesettings (
          geofence,
          defaultzoom,
          logo,
          title,
          sitename,
          languages,
          defaultLanguage
        ) VALUES (?,?,?,?,?,?,?)`,
        params: [
          args.input.targetBbox,
          args.input.defaultZoomLevel,
          args.input.logo,
          args.input.title,
          args.input.name,
          args.input.supportedLanguages,
          args.input.defaultLanguage
        ]
      }]);
    })
    .then(() => { 
      resolve({
        name: args.input.name,
        properties: {
          targetBbox: args.input.targetBbox,
          defaultZoomLevel: args.input.defaultZoomLevel,
          logo: args.input.logo,
          title: args.input.title,
          defaultLocation: args.input.defaultLocation,
          supportedLanguages:args.input.supportedLanguages
        }
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {siteType: string, targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
 * @returns {Promise}
 */
function createSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const siteType = args && args.input && args.input.siteType;
    if (!siteType || !siteType.length) return reject(`siteType for sitename ${args.input.name} is not defined`);

    cassandraConnector.executeQuery('SELECT * FROM fortis.sitesettings WHERE sitename = ?;', [args.input.name])
    .then(rows => {
      if (!rows || !rows.length) return insertTopics(siteType);
      else if (rows.length == 1) return reject(`Site with sitename ${args.input.name} already exists.`);
      else return reject(`(${rows.length}) number of sites with sitename ${args.input.name} already exist.`);
    })
    .then(() => {
      return cassandraConnector.executeBatchMutations([{
        query: `INSERT INTO fortis.sitesettings (
          geofence,
          defaultzoom,
          logo,
          title,
          sitename,
          languages,
          insertiontime
        ) VALUES (?,?,?,?,?,?,toTimestamp(now()))`,
        params: [
          args.input.targetBbox,
          args.input.defaultZoomLevel,
          args.input.logo,
          args.input.title,
          args.input.name,
          args.input.supportedLanguages
        ]
      }]);
    })
    .then(() => { 
      resolve({
        name: args.input.name,
        properties: {
          targetBbox: args.input.targetBbox,
          defaultZoomLevel: args.input.defaultZoomLevel,
          logo: args.input.logo,
          title: args.input.title,
          defaultLocation: args.input.defaultLocation,
          supportedLanguages:args.input.supportedLanguages
        }
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function removeKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.edges || !args.edges.length) return reject('No keywords to remove specified');

    const mutations = args.edges.map(edge => ({
      mutation: 'DELETE FROM fortis.watchlist WHERE keyword = ?',
      params: [edge.name]
    }));

    cassandraConnector.executeBatchMutations(mutations)
    .then(_ => { // eslint-disable-line no-unused-vars
      resolve({
        edges: args.edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function addKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.edges || !args.edges.length) return reject('No keywords to add specified');

    const mutations = args.edges.map(edge => ({
      mutation: 'INSERT INTO fortis.watchlist (keyword) VALUES (?)',
      params: [edge.name]
    }));

    cassandraConnector.executeBatchMutations(mutations)
    .then(_ => { // eslint-disable-line no-unused-vars
      resolve({
        edges: args.edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {siteType: string, targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
 * @returns {Promise}
 */
function removeSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    cassandraConnector.executeBatchMutations([{
      query: 'DELETE FROM fortis.sitesettings WHERE sitename = ?;',
      params: [args.input.name]
    }])
    .then(() => { 
      resolve({
        name: args.input.name,
        properties: {
          targetBbox: args.input.targetBbox,
          defaultZoomLevel: args.input.defaultZoomLevel,
          logo: args.input.logo,
          title: args.input.title,
          defaultLocation: args.input.defaultLocation,
          supportedLanguages: args.input.supportedLanguages
        }
      });
    })
    .catch(reject);
  });
}

function paramEntryToMap(paramEntry) {
  return paramEntry.reduce((obj, item) => (obj[item.key] = item.value, obj), {});
}

/**
 * @param {{input: {pipelineKey: string, pipelineLabel: string, pipelineIcon: string, streamFactory: string, params: Array<{String: String}>, enabled: boolean}}} args
 * @returns {Promise}
 */
function modifyStreams(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const streams = args && args.input && args.input.streams;
    if (!streams || !streams.length) return reject('No streams specified');
    
    const mutations = [];
    streams.forEach(stream => {
      let params = paramEntryToMap(stream.params);
      mutations.push({
        query: `UPDATE fortis.streams 
        SET pipelinelabel = ?,
        pipelineicon = ?,
        streamfactory = ?,
        params = ?,
        enabled = ? 
        WHERE streamid = ? AND pipelinekey = ?`,
        params: [
          stream.pipelineLabel,
          stream.pipelineIcon,
          stream.streamFactory,
          params,
          stream.enabled,
          stream.streamId,
          stream.pipelineKey
        ]
      });
    });

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => {
      resolve({
        streams
      });
    })
    .catch(reject);
  });
}


/**
 * @param {{input: {pipelineKey: string, pipelineLabel: string, pipelineIcon: string, streamFactory: string, params: Array<{String: String}>}}} args
 * @returns {Promise}
 */
function removeStream(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const pipelineKey = args && args.input && args.input.pipelineKey;
    if (!pipelineKey || !pipelineKey.length) return reject('No pipelineKey specified.');
    
    cassandraConnector.executeBatchMutations([{
      query: 'DELETE FROM fortis.streams WHERE pipelinekey = ?',
      params: [pipelineKey]
    }])      
    .then(() => {
      resolve({
        properties: {
          pipelineKey
        }
      });
    })
    .catch(reject);
  });
}

function facebookPagePrimaryKeyValuesToRowKey(values) {
  return [TRUSTED_SOURCES_CONNECTOR_FACEBOOK, values[1], values[2]];
}

function facebookPageRowKeyToPrimaryKey(page) {
  const params = page.RowKey.split(',');
  if (params.length != 3) throw('Expecting three element comma-delimited RowKey representing (connector, sourceid, sourcetype).');
  return facebookPagePrimaryKeyValuesToRowKey(params);
}

function normalizedFacebookPage(primaryKeyValues) {
  return {
    RowKey: facebookPagePrimaryKeyValuesToRowKey(primaryKeyValues),
    pageUrl: primaryKeyValues[1]
  };
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function modifyFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const pages = args && args.input && args.input.pages;
    if (!pages || !pages.length) return reject('No pages specified');
    
    const invalidPages = pages.filter(page => !page.pageUrl);
    if (invalidPages.length > 0) return reject(`pageUrl required for ${JSON.stringify(invalidPages)}`);

    const mutations = [];
    const expectedRecords = [];
    pages.forEach(page => {
      const isUpdate = page.RowKey && page.pageUrl != facebookPageRowKeyToPrimaryKey(page)[1];
      if (isUpdate) {
        mutations.push({
          query: 'DELETE FROM fortis.trustedsources WHERE connector = ? AND sourceid = ? AND sourcetype = ?',
          params: facebookPageRowKeyToPrimaryKey(page)
        });
      }
      
      const params = facebookPagePrimaryKeyValuesToRowKey([TRUSTED_SOURCES_CONNECTOR_FACEBOOK, page.pageUrl, 'FacebookPost']);
      params.push(TRUSTED_SOURCES_RANK_DEFAULT);
      mutations.push({
        query: 'INSERT INTO fortis.trustedsources (connector, sourceid, sourcetype, insertiontime, rank) VALUES (?, ?, ?, dateof(now()), ?)',
        params: params
      });
      expectedRecords.push(normalizedFacebookPage(params));
    });

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => resolve({ pages: expectedRecords }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function removeFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const pages = args && args.input && args.input.pages;
    if (!pages || !pages.length) return reject('No pages specified');
    
    const invalidPages = pages.filter(page => !page.RowKey);
    if (invalidPages.length > 0) return reject(`RowKey required for ${JSON.stringify(invalidPages)}`);

    const mutations = pages.map(page => ({
      query: 'DELETE FROM fortis.trustedsources WHERE connector = ? AND sourceid = ? AND sourcetype = ?',
      params: facebookPageRowKeyToPrimaryKey(page)
    }));

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => resolve({ pages: pages }))
    .catch(reject);
  });
}

function trustedTwitterAccountRowKeyToPrimaryKey(account) {
  const params = account.RowKey.split(',');
  if (params.length != 3) throw('Expecting three element comma-delimited RowKey representing (connector, sourceid, sourcetype).');
  return trustedTwitterAccountPrimaryKeyValuesToRowKey(params);
}

function trustedTwitterAccountPrimaryKeyValuesToRowKey(values) {
  return [ TRUSTED_SOURCES_CONNECTOR_TWITTER, values[1], values[2] ];
}

function normalizedTrustedTwitterAccount(account) {
  const keyValues = trustedTwitterAccountRowKeyToPrimaryKey(account);
  return {
    RowKey: trustedTwitterAccountPrimaryKeyValuesToRowKey(keyValues),
    acctUrl: keyValues[1]
  };
}

/**
 * @param {{input: {site: string, accounts: Array<{acctUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{pageUrl: string, RowKey: string}>}>}
 */
function modifyTrustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const accounts = args && args.input && args.input.accounts;
    if (!accounts || !accounts.length) return reject('No accounts specified');
    
    const statement = 'INSERT INTO fortis.trustedsources (connector, sourceid, sourcetype, insertiontime, rank) VALUES (?, ?, ?, dateof(now()), ?)';
    const queries = accounts.map(account => {
      const params = trustedTwitterAccountRowKeyToPrimaryKey(account);
      params.push(TRUSTED_SOURCES_RANK_DEFAULT);

      return {query: statement, params: params};
    });

    cassandraConnector.executeBatchMutations(queries)
    .then(() => resolve({ accounts: accounts.map(normalizedTrustedTwitterAccount) }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, accounts: Array<{acctUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{pageUrl: string, RowKey: string}>}>}
 */
function removeTrustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const accounts = args && args.input && args.input.accounts;
    if (!accounts || !accounts.length) return reject('No accounts specified');
    
    const deleteByPrimaryKey = 'DELETE FROM fortis.trustedsources WHERE connector = ? AND sourceid = ? AND sourcetype = ?';
    const queries = accounts.map(trustedTwitterAccountRowKeyToPrimaryKey).map(params => ({query: deleteByPrimaryKey, params}));

    cassandraConnector.executeBatchMutations(queries)
    .then(() => resolve({ accounts: accounts.map(normalizedTrustedTwitterAccount) }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
 */
function modifyTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const accounts = args && args.input && args.input.accounts;
    if (!accounts || !accounts.length) return reject('No accounts specified');

    const updateStatement = 'UPDATE fortis.streams set connector = ?, params = ? WHERE pipeline= ? AND streamid = ?';
    const insertStatement = 'INSERT INTO fortis.streams (pipeline, streamid, connector, params) VALUES (?, ?, ?, ?)';
    const queries = [];
    const expectedRecords = [];
    accounts.forEach( account => {
      // TODO: Arrive at a consensus as to what a canonical account should be in order to create a proper copy of the incoming record.
      const updatedAccount = account;
      if (account.RowKey) {
        queries.push({ query: updateStatement, params: [STREAM_CONNECTOR_TWITTER, account, STREAM_PIPELINE_TWITTER, account.RowKey] });
      } else {
        updatedAccount.RowKey = uuid();
        queries.push({ query: insertStatement, params: [STREAM_PIPELINE_TWITTER, updatedAccount.RowKey, STREAM_CONNECTOR_TWITTER, account] });
      }
      expectedRecords.push(updatedAccount);
    });

    cassandraConnector.executeBatchMutations(queries)
    .then(() => resolve({ accounts: expectedRecords }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
 */
function removeTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const accounts = args && args.input && args.input.accounts;
    if (!accounts || !accounts.length) return reject('No accounts specified');

    const invalidAccounts = accounts.filter(account=>!account.RowKey);
    if (invalidAccounts.length > 0) return reject(`RowKey required for ${JSON.stringify(invalidAccounts)}`);

    const statement = 'DELETE FROM fortis.streams WHERE streamid = ?';
    const queries = accounts.map(account => ({query: statement, params: [account.RowKey]}));

    cassandraConnector.executeBatchMutations(queries)
    .then(() => resolve({ accounts }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function modifyBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const terms = args && args.input && args.input.terms;
    if (!terms || !terms.length) return reject('No terms specified');

    const mutations = [];
    const filterRecords = [];
    terms.forEach(term => {
      if (term.RowKey) {
        mutations.push({
          query:'UPDATE blacklist SET conjunctivefilter = ? WHERE id = ?',
          params:[term.filteredTerms, term.RowKey]
        });
      } else {
        term.RowKey = uuid();
        mutations.push({
          query:'INSERT INTO blacklist (id, conjunctivefilter) VALUES(?, ?)',
          params:[term.RowKey, term.filteredTerms]
        });
      }
      filterRecords.push(term);
    });

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => resolve({ filters: filterRecords }))
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function removeBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const terms = args && args.input && args.input.terms;
    if (!terms || !terms.length) return reject('No terms specified');
    
    const invalidTerms = terms.some(terms => !terms.RowKey);
    if (invalidTerms.length > 0) return reject(`RowKey required for ${JSON.stringify(invalidTerms)}`);

    const termIds = terms.map(term => term.RowKey);
    
    const query = `
    DELETE
    FROM fortis.blacklist
    WHERE id IN ?
    `;

    const params = [
      limitForInClause(termIds)
    ];

    cassandraConnector.executeQuery(query, params)
    .then(() => {
      resolve({
        filters: terms
      });
    })
    .catch(reject);
  });
}

module.exports = {
  createOrReplaceSite: createOrReplaceSite,
  createSite: trackEvent(createSite, 'createSite'),
  removeSite: trackEvent(removeSite, 'removeSite'),
  modifyStreams: trackEvent(withRunTime(modifyStreams), 'modifyStreams'),
  removeKeywords: trackEvent(withRunTime(removeKeywords), 'removeKeywords'),
  addKeywords: trackEvent(withRunTime(addKeywords), 'addKeywords'),
  editSite: trackEvent(withRunTime(editSite), 'editSite'),
  removeStream: trackEvent(removeStream, 'removeStream'),
  modifyFacebookPages: trackEvent(withRunTime(modifyFacebookPages), 'modifyFacebookPages'),
  removeFacebookPages: trackEvent(withRunTime(removeFacebookPages), 'removeFacebookPages'),
  modifyTrustedTwitterAccounts: trackEvent(withRunTime(modifyTrustedTwitterAccounts), 'modifyTrustedTwitterAccounts'),
  removeTrustedTwitterAccounts: trackEvent(withRunTime(removeTrustedTwitterAccounts), 'removeTrustedTwitterAccounts'),
  modifyTwitterAccounts: trackEvent(withRunTime(modifyTwitterAccounts), 'modifyTwitterAccounts'),
  removeTwitterAccounts: trackEvent(withRunTime(removeTwitterAccounts), 'removeTwitterAccounts'),
  modifyBlacklist: trackEvent(withRunTime(modifyBlacklist), 'modifyBlacklist'),
  removeBlacklist: trackEvent(withRunTime(removeBlacklist), 'removeBlacklist')
};
