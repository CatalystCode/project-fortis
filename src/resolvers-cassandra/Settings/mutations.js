'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;

const STREAM_PIPELINE_TWITTER = 'twitter';
const STREAM_CONNECTOR_TWITTER = 'twitter';

const TRUSTED_SOURCES_RANK_DEFAULT = 10;

/**
 * @param {{input: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
 * @returns {Promise.<{name: string, properties: {targetBBox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}
 */
function createOrReplaceSite(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function modifyFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    reject("Modification not yet supported.");
  });
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function removeFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    reject("Removal not yet supported.");
  });
}

function trustedTwitterAccountRowKeyToPrimaryKey(account) {
  const params = account.RowKey.split(/,/);
  if (params.length != 3) {
    throw("Expecting three element comma-delimited RowKey representing (connector, sourceid, sourcetype).");
  }
  return params;
}

function normalizedTrustedTwitterAccount(account) {
  const keyValues = trustedTwitterAccountRowKeyToPrimaryKey(account);
  return {
    RowKey: account.RowKey,
    acctUrl: keyValues[1]
  }
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
    .then(() => { resolve({ accounts: accounts.map(normalizedTrustedTwitterAccount) }) })
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

    const statement = 'INSERT INTO fortis.streams (pipeline, connector, params) values (?, ?, ?)';
    const queries = accounts.map( account => { return { query: statement, params: [STREAM_PIPELINE_TWITTER, STREAM_CONNECTOR_TWITTER, account]}; } );

    cassandraConnector.executeBatchMutations(queries)
    .then(() => { resolve({ accounts: accounts }); })
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

    const statement = 'DELETE FROM fortis.streams WHERE pipeline = ? AND connector = ? AND params = ?';
    const queries = accounts.map( account => { return { query: statement, params: [STREAM_PIPELINE_TWITTER, STREAM_CONNECTOR_TWITTER, account]}; } );

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
    reject("Modification not yet supported.");
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
  createOrReplaceSite: createOrReplaceSite,
  modifyFacebookPages: withRunTime(modifyFacebookPages),
  removeFacebookPages: withRunTime(removeFacebookPages),
  modifyTrustedTwitterAccounts: withRunTime(modifyTrustedTwitterAccounts),
  removeTrustedTwitterAccounts: withRunTime(removeTrustedTwitterAccounts),
  modifyTwitterAccounts: withRunTime(modifyTwitterAccounts),
  removeTwitterAccounts: withRunTime(removeTwitterAccounts),
  modifyBlacklist: withRunTime(modifyBlacklist),
  removeBlacklist: withRunTime(removeBlacklist)
};
