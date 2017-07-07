'use strict';

const Promise = require('promise');
const uuid = require('uuid/v4');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const blobStorageClient = require('../../clients/storage/BlobStorageClient');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;
const apiUrlBase = process.env.FORTIS_CENTRAL_ASSETS_HOST || 'https://fortiscentral.blob.core.windows.net';
const STREAM_PIPELINE_TWITTER = 'twitter';
const STREAM_CONNECTOR_TWITTER = 'Twitter';

const TRUSTED_SOURCES_CONNECTOR_TWITTER = 'Twitter';
const TRUSTED_SOURCES_RANK_DEFAULT = 10;

function deleteTopics() {
  return new Promise((resolve, reject) => {
    let mutations = [{
      mutation: 'TRUNCATE fortis.watchlist',
      params: []
    }];

    cassandraConnector.executeBatchMutations(mutations)
      .then(resolve)
      .catch(reject);
  });
}

function insertTopics(siteType) {
  return new Promise((resolve, reject) => {
    let uri = `${apiUrlBase}/settings/siteTypes/${siteType}/topics/defaultTopics.json`;
    blobStorageClient.fetchJson(uri)
      .then(response => {
        let mutations = [];
        response.forEach( topic => {
          mutations.push({
            mutation: `INSERT INTO fortis.watchlist (keyword,lang_code,translations,insertion_time) 
                      VALUES (?, ?, ?, dateof(now()));`,
            params: [topic.keyword, topic.lang_code, topic.translations]
          });
        });
        return mutations;
      })
      .then(mutations => {
        return cassandraConnector.executeBatchMutations(mutations);
      })
      .then(resolve)
      .catch(reject);
  });
}

function createSite(args) {
  return new Promise((resolve, reject) => {
    const siteType = args.input.siteType;
    deleteTopics()
      .then(() => {
        return insertTopics(siteType);
      })
      .then(() => {
        //create site - insert the record in site settings table
        return cassandraConnector.executeBatchMutations([{
          query: `INSERT INTO fortis.sitesettings (
            id,
            sitetype, 
            sitename,
            geofence,
            languages,
            defaultzoom,
            title,
            logo,
            translationsvctoken,
            cogspeechsvctoken,
            cogvisionsvctoken,
            cogtextsvctoken,
            insertion_time
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,dateof(now()))`,
          params: [
            `${args.RowKey}`,
            `${args.siteType}`,
            `${args.name}`,
            `${args.targetBbox}`,
            `${args.supportedLanguages}`,
            `${args.defaultZoomLevel}`,
            `${args.title}`,
            `${args.logo}`,
            'translation-token', //TODO: Get actual values for these
            'cogspeech-token',
            'cogvision-token',
            'cogtext-token'
          ]
        }]);
      })
      .then(resolve)
      .catch(reject);
  });
}

function replaceSite(args) {
  return new Promise((resolve, reject) => {
    //TODO: sitetype is not in sitesettings table yet
    cassandraConnector.executeBatchMutations([{
      query: `UPDATE fortis.sitesettings 
      SET id = ?,
      sitetype = ?, 
      sitename = ?,
      geofence = ?,
      languages = ?,
      defaultzoom = ?,
      title = ?,
      logo = ?,
      translationsvctoken = ?,
      cogspeechsvctoken = ?,
      cogvisionsvctoken = ?,
      cogtextsvctoken = ?,
      insertion_time = dateof(now()), 
      WHERE WHERE id = ? AND sitename = ?`,
      params: [
        `${args.RowKey}`,
        `${args.siteType}`,
        `${args.name}`,
        `${args.targetBbox}`,
        `${args.supportedLanguages}`,
        `${args.defaultZoomLevel}`,
        `${args.title}`,
        `${args.logo}`,
        'translation-token', //TODO: Get actual values for these
        'cogspeech-token',
        'cogvision-token',
        'cogtext-token',
        `${args.RowKey}`,`${args.name}`
      ]
    }])
      .then(resolve)
      .catch(reject);
  });
}

/**
 * @param {{input: {RowKey: string, siteType: string, targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
 * @returns {Promise.<{name: string, properties: {RowKey: string, targetBBox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}
 */
function createOrReplaceSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {

    const siteType = args && args.input && args.input.siteType;
    if (!siteType) return reject(`siteType for ${args.name} is not defined`);
    
    const rowKey = args && args.input && args.input.RowKey;
    if(!rowKey) return reject(`RowKey required for ${JSON.stringify(args)}`);

    cassandraConnector.executeQuery('SELECT * FROM fortis.sitesettings WHERE id = ? AND sitename = ?', [`${args.RowKey}`,`${args.name}`])
      .then(rows => {
        if(!rows || !rows.length) {
          return createSite(args);
        }
        else if(rows.length == 1) {
          return replaceSite(args);
        }
        else return reject(`More than one site with sitename: ${args.name}`);
      })
      .then(resolve)
      .catch(reject);
  });
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function modifyFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    reject('Modification not yet supported.');
  });
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function removeFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    reject('Removal not yet supported.');
  });
}

function trustedTwitterAccountRowKeyToPrimaryKey(account) {
  const params = account.RowKey.split(',');
  if (params.length != 3) {
    throw('Expecting three element comma-delimited RowKey representing (connector, sourceid, sourcetype).');
  }
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
    
    const statement = 'INSERT INTO fortis.trustedsources (connector, sourceid, sourcetype, insertion_time, rank) VALUES (?, ?, ?, dateof(now()), ?)';
    const queries = accounts.map(account => {
      const params = trustedTwitterAccountRowKeyToPrimaryKey(account);
      params.push(TRUSTED_SOURCES_RANK_DEFAULT);

      return {query: statement, params: params};
    });

    cassandraConnector.executeBatchMutations(queries)
    .then(() => { resolve({ accounts: accounts.map(normalizedTrustedTwitterAccount) }); })
    .catch(reject)
    ;
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
    const queries = accounts.map(account => {
      const params = trustedTwitterAccountRowKeyToPrimaryKey(account);
      return {query: deleteByPrimaryKey, params: params};
    });

    cassandraConnector.executeBatchMutations(queries)
    .then(() => { resolve({ accounts: accounts.map(normalizedTrustedTwitterAccount) }); })
    .catch(reject)
    ;
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
      }
      else {
        updatedAccount.RowKey = uuid();
        queries.push({ query: insertStatement, params: [STREAM_PIPELINE_TWITTER, updatedAccount.RowKey, STREAM_CONNECTOR_TWITTER, account] });
      }
      expectedRecords.push(updatedAccount);
    });

    cassandraConnector.executeBatchMutations(queries)
    .then(() => { resolve({ accounts: expectedRecords }); })
    .catch(reject)
    ;

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
    if (invalidAccounts.length > 0) {
      reject(`RowKey required for ${JSON.stringify(invalidAccounts)}`);
      return;
    }

    const statement = 'DELETE FROM fortis.streams WHERE streamid = ?';
    const queries = accounts.map( account => { return { query: statement, params: [ account.RowKey ] }; } );

    cassandraConnector.executeBatchMutations(queries)
    .then(() => { resolve({ accounts: accounts }); })
    .catch(reject)
    ;

  });
}

/**
 * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function modifyBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    reject('Modification not yet supported.');
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
    
    const params = [terms.map( t => { return t.RowKey; } )];
    const update = 'DELETE FROM fortis.blacklist WHERE id IN ?';
    cassandraConnector.executeQuery(update, params)
    .then(() => { resolve({ filters: terms }); })
    .catch(reject)
    ;
  });
}

module.exports = {
  createOrReplaceSite: trackEvent(createOrReplaceSite, 'createOrReplaceSite'),
  modifyFacebookPages: trackEvent(withRunTime(modifyFacebookPages), 'modifyFacebookPages'),
  removeFacebookPages: trackEvent(withRunTime(removeFacebookPages), 'removeFacebookPages'),
  modifyTrustedTwitterAccounts: trackEvent(withRunTime(modifyTrustedTwitterAccounts), 'modifyTrustedTwitterAccounts'),
  removeTrustedTwitterAccounts: trackEvent(withRunTime(removeTrustedTwitterAccounts), 'removeTrustedTwitterAccounts'),
  modifyTwitterAccounts: trackEvent(withRunTime(modifyTwitterAccounts), 'modifyTwitterAccounts'),
  removeTwitterAccounts: trackEvent(withRunTime(removeTwitterAccounts), 'removeTwitterAccounts'),
  modifyBlacklist: trackEvent(withRunTime(modifyBlacklist), 'modifyBlacklist'),
  removeBlacklist: trackEvent(withRunTime(removeBlacklist), 'removeBlacklist')
};
