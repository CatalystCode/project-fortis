'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

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
}

/**
 * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
 */
function removeFacebookPages(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, accounts: Array<{acctUrl: string, RowKey: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{pageUrl: string, RowKey: string}>}>}
 */
function modifyTrustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
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
      const params = account.RowKey.split(/,/);
      return {query: deleteByPrimaryKey, params: params};
    });

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
function modifyTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
 */
function removeTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function modifyBlacklist(args, res) { // eslint-disable-line no-unused-vars
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
