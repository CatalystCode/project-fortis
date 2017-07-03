'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../../clients/facebook/FacebookAnalyticsClient');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');

function cassandraRowToSite(row) {
  return {
    name: row.sitename,
    properties: {
      targetBbox: row.geofence,
      defaultZoomLevel: row.defaultzoom,
      logo: row.logo,
      title: row.title,
      defaultLocation: row.geofence,
      // TODO: Ask what the following commented properties map to:
    // storageConnectionString: String,
    // featuresConnectionString: String,
    // mapzenApiKey: String,
    // fbToken: String,
      supportedLanguages: row.languages
    }
  };
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, sites: Array<{name: string, properties: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}>}
 */
function sites(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const siteId = args.siteId;
    if (!siteId) {
      return reject('No site id to fetch specified');
    }

    const siteById = 'SELECT * FROM fortis.sitesettings WHERE id = ?';
    cassandraConnector.executeQuery(siteById, [siteId])
    // .catch(err => reject(err))
    .then(rows => {
      if (rows.length < 1) {
        return reject(`Could not find site with id ${siteId}`);
      }
      if (rows.length > 1) {
        return reject(`Got more than one (${rows.length}) site with id ${siteId}`);
      }

      const site = cassandraRowToSite(rows[0]);
      const siteCollection = Object.assign({}, {runTime: '' + (Date.now() - startTime), sites: [ site ]});
      resolve(siteCollection);
    })
    .catch(err => reject(err))
    ;
  });
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
 */
function twitterAccounts(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, accounts: Array<{RowKey: string, acctUrl: string}>}>}
 */
function trustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, pages: Array<{RowKey: string, pageUrl: string}>}>}
 */
function facebookPages(args, res) { // eslint-disable-line no-unused-vars
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

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
 */
function termBlacklist(args, res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  sites: sites,
  twitterAccounts: twitterAccounts,
  trustedTwitterAccounts: trustedTwitterAccounts,
  facebookPages: facebookPages,
  facebookAnalytics: facebookAnalytics,
  termBlacklist: termBlacklist
};
