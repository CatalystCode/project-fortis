'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../../clients/facebook/FacebookAnalyticsClient');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

const CONNECTOR_TWITTER = 'Twitter';
const CONNECTOR_FACEBOOK = 'Facebook';

function cassandraRowToSite(row) {
  // Please note that the following properties in the SiteProperties are NOT in Cassandra's sitessetings:
  // storageConnectionString, featuresConnectionString, mapzenApiKey, fbToken.
  return {
    name: row.sitename,
    properties: {
      targetBbox: row.geofence,
      defaultZoomLevel: row.defaultzoom,
      logo: row.logo,
      title: row.title,
      defaultLocation: row.geofence,
      supportedLanguages: row.languages
    }
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, sites: Array<{name: string, properties: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}>}
 */
function sites(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const siteId = args.siteId;
    if (!siteId) {
      return reject('No site id to fetch specified');
    }

    const siteById = 'SELECT * FROM fortis.sitesettings WHERE id = ?';
    cassandraConnector.executeQuery(siteById, [siteId])
    .then(rows => {
      if (rows.length < 1) return reject(`Could not find site with id ${siteId}`);
      if (rows.length > 1) return reject(`Got more than one site (got ${rows.length}) with id '${siteId}'`);

      const site = cassandraRowToSite(rows[0]);
      resolve({sites: [site]});
    })
    .catch(reject);
  });
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
    .then(rows => {
      const accounts = rows.map(cassandraRowToTwitterAccount);
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

/**
 * @param {{siteId: string, days: number}} args
 * @returns {Promise.<{analytics: Array<{Name: string, Count: number, LastUpdated: string}>}>}
 */
function facebookAnalytics(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const pageIds = ['aljazeera', 'microsoftvan']; // todo: fetch pages for args.siteId from sitesettings

    Promise.all(pageIds.map(pageId => ({Name: pageId, LastUpdated: facebookAnalyticsClient.fetchPageLastUpdatedAt(pageId), Count: -1})))
    .then(analytics => resolve({analytics}))
    .catch(err => reject(err));
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
  twitterAccounts: trackEvent(withRunTime(twitterAccounts), 'twitterAccounts'),
  trustedTwitterAccounts: trackEvent(withRunTime(trustedTwitterAccounts), 'trustedTwitterAccounts'),
  facebookPages: trackEvent(withRunTime(facebookPages), 'facebookPages'),
  facebookAnalytics: trackEvent(facebookAnalytics, 'facebookAnalytics'),
  termBlacklist: trackEvent(withRunTime(termBlacklist), 'termBlacklist')
};
