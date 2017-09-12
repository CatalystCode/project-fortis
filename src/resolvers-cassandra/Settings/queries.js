'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../../clients/facebook/FacebookAnalyticsClient');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const {withRunTime, getSiteDefintion} = require('../shared');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

const CONNECTOR_TWITTER = 'Twitter';
const CONNECTOR_FACEBOOK = 'Facebook';

function transformWatchlist(item, translatedlanguage){
  return {
    topicid: item.topicid,
    name: item.topic.toLowerCase(),
    translatedname: item.lang_code !== (translatedlanguage || item.lang_code) ? 
    (item.translations || {})[translatedlanguage] : item.topic,
    translatednamelang: translatedlanguage,
    namelang: item.lang_code
  };
}

/**
* @param {{translationLanguage: string}} args
* @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
*/
function terms(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const translationLanguage = args.translationLanguage || 'en';

    const query = `
    SELECT topicid, topic, translations, lang_code
    FROM fortis.watchlist
    `.trim();

    const params = [ ];
    cassandraConnector.executeQuery(query, params)
    .then(rows => 
      resolve({
        edges: rows
        .map(item => transformWatchlist(item, translationLanguage))
        .filter(term => term.translatedname)
      })
    ).catch(reject);
  });
}

/**
 * @param {{}} args
 * @returns {Promise.<{runTime: string, sites: Array<{name: string, properties: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}>}
 */
function sites(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {   
    getSiteDefintion()
    .then(resolve)
    .catch(reject);
  });
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, sites: Array<{pipelineKey: string, pipelineLabel: string, pipelineIcon: string, streamFactory: string, enabled: boolean}>}>}
 */
function streams(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    cassandraConnector.executeQuery('SELECT * FROM fortis.streams', [])
    .then(rows => {
      const streams = rows.map(cassandraRowToStream);
      resolve({
        streams
      });
    })
    .catch(reject);
  });
}

function cassandraRowToStream(row) {
  if (row.enabled == null) row.enabled = true;
  return {
    streamId: row.streamid,
    pipelineKey: row.pipelinekey,
    pipelineLabel: row.pipelinelabel,
    pipelineIcon: row.pipelineicon,
    streamFactory: row.streamfactory,
    params: paramsToParamsEntries(row.params),
    enabled: row.enabled
  };
}

function paramsToParamsEntries(params) {
  const paramsEntries = [];
  for (const key of Object.keys(params)) {
    let value = params[key];
    let paramsEntry = {
      key,
      value
    };
    paramsEntries.push(paramsEntry);
  }
  return paramsEntries;
}

function cassandraRowToTwitterAccount(row) {
  return {
    accountName: row.params.accountName,
    consumerKey: row.params.consumerKey,
    consumerSecret: row.params.consumerSecret,
    token: row.params.token,
    tokenSecret: row.params.tokenSecret
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
 */
function twitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const sourcesByConnector = 'SELECT params FROM fortis.streams WHERE connector = ? ALLOW FILTERING';
    cassandraConnector.executeQuery(sourcesByConnector, [CONNECTOR_TWITTER])
    .then(result => {
      const accounts = result.map(cassandraRowToTwitterAccount);
      resolve({accounts: accounts});
    })
    .catch(reject)
    ;
  });
}

function cassandraRowToTrustedTwitterAccount(row) {
  return {
    RowKey: `${row.connector},${row.sourceid},${row.sourcetype}`,
    acctUrl: row.sourceid
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{RowKey: string, acctUrl: string}>}>}
 */
function trustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const sourcesByConnector = 'SELECT connector, sourceid, sourcetype  FROM fortis.trustedsources WHERE connector = ? ALLOW FILTERING';
    cassandraConnector.executeQuery(sourcesByConnector, [CONNECTOR_TWITTER])
    .then(rows => {
      const accounts = rows.map(cassandraRowToTrustedTwitterAccount);
      resolve({accounts: accounts});
    })
    .catch(reject)
    ;
  });
}

function cassandraRowToFacebookPage(row) {
  return {
    RowKey: `${row.connector},${row.sourceid},${row.sourcetype}`,
    pageUrl: row.sourceid
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, pages: Array<{RowKey: string, pageUrl: string}>}>}
 */
function facebookPages(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const sourcesByConnector = 'SELECT connector, sourceid, sourcetype FROM fortis.trustedsources WHERE connector = ? ALLOW FILTERING';
    cassandraConnector.executeQuery(sourcesByConnector, [CONNECTOR_FACEBOOK])
    .then(rows => {
      const pages = rows.map(cassandraRowToFacebookPage);
      resolve({pages: pages});
    })
    .catch(reject)
    ;
  });
}

function facebookPageToId(page) {
  const match = page && page.pageUrl && page.pageUrl.match(/facebook.com\/([^/]+)/);
  return match && match.length >= 1 && match[1];
}

/**
 * @param {{siteId: string, days: number}} args
 * @returns {Promise.<{analytics: Array<{Name: string, Count: number, LastUpdated: string}>}>}
 */
function facebookAnalytics(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    facebookPages({siteId: args.siteId})
    .then(response => {
      const pageIds = response.pages.map(facebookPageToId).filter(pageId => !!pageId);
      Promise.all(pageIds.map(pageId => ({Name: pageId, LastUpdated: facebookAnalyticsClient.fetchPageLastUpdatedAt(pageId), Count: -1})))
      .then(analytics => resolve({analytics}))
      .catch(reject);
    });
  });
}

function cassandraRowToTermFilter(row) {
  return {
    filteredTerms: row.conjunctivefilter,
    lang: null,
    RowKey: row.id
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function termBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const blacklistQuery = 'SELECT id, conjunctivefilter FROM fortis.blacklist';
    cassandraConnector.executeQuery(blacklistQuery, [])
    .then(rows => {
      const filters = rows.map(cassandraRowToTermFilter);
      resolve({ filters: filters });
    })
    .catch(reject)
    ;
  });
}

module.exports = {
  sites: trackEvent(withRunTime(sites), 'sites'),
  streams: trackEvent(withRunTime(streams), 'streams'),
  siteTerms: trackEvent(withRunTime(terms), 'terms'),
  twitterAccounts: trackEvent(withRunTime(twitterAccounts), 'twitterAccounts'),
  trustedTwitterAccounts: trackEvent(withRunTime(trustedTwitterAccounts), 'trustedTwitterAccounts'),
  facebookPages: trackEvent(withRunTime(facebookPages), 'facebookPages'),
  facebookAnalytics: trackEvent(facebookAnalytics, 'facebookAnalytics'),
  termBlacklist: trackEvent(withRunTime(termBlacklist), 'termBlacklist')
};