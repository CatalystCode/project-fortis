'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../clients/facebook/FacebookAnalyticsClient');

/**
 * @param {{siteId: string}} args
 * @returns {Promise.<{runTime: string, sites: Array<{name: string, properties: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}>}
 */
function sites(args, res) { // eslint-disable-line no-unused-vars
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
