'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../clients/facebook/FacebookAnalyticsClient');

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  /**
   * @param {{input: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, name: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}} args
   * @returns {Promise.<{name: string, properties: {targetBBox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}
   */
  createOrReplaceSite(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
   * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
   */
  modifyFacebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, pages: Array<{pageUrl: string, RowKey: string}>}}} args
   * @returns {Promise.<{runTime: string, pages: Array<{pageUrl: string, RowKey: string}>}>}
   */
  removeFacebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, accounts: Array<{acctUrl: string, RowKey: string}>}}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{pageUrl: string, RowKey: string}>}>}
   */
  modifyTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, accounts: Array<{acctUrl: string, RowKey: string}>}}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{pageUrl: string, RowKey: string}>}>}
   */
  removeTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
   */
  modifyTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
   */
  removeTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
   * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
   */
  modifyBlacklist(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, terms: Array<{RowKey: string, lang: string, filteredTerms: string[]}>}}} args
   * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
   */
  removeBlacklist(args, res){ // eslint-disable-line no-unused-vars
  },

  // ------------------------------------------------------------------------------------ queries

  /**
   * @param {{siteId: string}} args
   * @returns {Promise.<{runTime: string, sites: Array<{name: string, properties: {targetBbox: number[], defaultZoomLevel: number, logo: string, title: string, defaultLocation: number[], storageConnectionString: string, featuresConnectionString: string, mapzenApiKey: string, fbToken: string, supportedLanguages: string[]}}>}>}
   */
  sites(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{siteId: string}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{accountName: string, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string}>}>}
   */
  twitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{siteId: string}} args
   * @returns {Promise.<{runTime: string, accounts: Array<{RowKey: string, acctUrl: string}>}>}
   */
  trustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{siteId: string}} args
   * @returns {Promise.<{runTime: string, pages: Array<{RowKey: string, pageUrl: string}>}>}
   */
  facebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{siteId: string, days: number}} args
   * @returns {Promise.<{analytics: Array<{Name: string, Count: number, LastUpdated: string}>}>}
   */
  facebookAnalytics(args, res){ // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      const pageIds = ['aljazeera', 'microsoftvan']; // todo: fetch pages for args.siteId from sitesettings

      Promise.all(pageIds.map(pageId => ({Name: pageId, LastUpdated: facebookAnalyticsClient.fetchPageLastUpdatedAt(pageId), Count: -1})))
      .then(analytics => resolve({analytics}))
      .catch(err => reject(err));
    });
  },

  /**
   * @param {{siteId: string}} args
   * @returns {Promise.<{runTime: string, filters: Array<{filteredTerms: string[], lang: string, RowKey: string}>}>}
   */
  termBlacklist(args, res){ // eslint-disable-line no-unused-vars
  }
};
