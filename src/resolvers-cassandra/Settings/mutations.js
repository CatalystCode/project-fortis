'use strict';

const Promise = require('promise');
const uuid = require('uuid/v4');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

const STREAM_PIPELINE_TWITTER = 'twitter';
const STREAM_CONNECTOR_TWITTER = 'Twitter';

const TRUSTED_SOURCES_CONNECTOR_TWITTER = 'Twitter';
const TRUSTED_SOURCES_CONNECTOR_FACEBOOK = 'FacebookPage';
const TRUSTED_SOURCES_RANK_DEFAULT = 10;

/**
 * @param {{input: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
 * @returns {Promise.<{name: string, properties: {targetBBox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}
 */
function createOrReplaceSite(args, res) { // eslint-disable-line no-unused-vars
}

function facebookPagePrimaryKeyValuesToRowKey(values) {
  return [ TRUSTED_SOURCES_CONNECTOR_FACEBOOK, values[1], values[2] ];
}

function facebookPageRowKeyToPrimaryKey(page) {
  const params = page.RowKey.split(',');
  if (params.length != 3) {
    throw('Expecting three element comma-delimited RowKey representing (connector, sourceid, sourcetype).');
  }
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
    
    const invalidPages = pages.filter(pages=>!pages.pageUrl);
    if (invalidPages.length > 0) {
      reject(`pageUrl required for ${JSON.stringify(invalidPages)}`);
      return;
    }

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
        query: 'INSERT INTO fortis.trustedsources (connector, sourceid, sourcetype, insertion_time, rank) VALUES (?, ?, ?, dateof(now()), ?)',
        params: params
      });
      expectedRecords.push(normalizedFacebookPage(params));
    });

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => { resolve({ pages: expectedRecords }); })
    .catch(reject)
    ;
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
    
    const invalidPages = pages.filter(pages=>!pages.RowKey);
    if (invalidPages.length > 0) {
      reject(`RowKey required for ${JSON.stringify(invalidPages)}`);
      return;
    }

    const mutations = pages.map(page => {
      return {
        query: 'DELETE FROM fortis.trustedsources WHERE connector = ? AND sourceid = ? AND sourcetype = ?',
        params: facebookPageRowKeyToPrimaryKey(page)
      };
    });

    cassandraConnector.executeBatchMutations(mutations)
    .then(() => { resolve({ pages: pages }); })
    .catch(reject)
    ;
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
