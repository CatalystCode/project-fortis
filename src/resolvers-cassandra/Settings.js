'use strict';

const Promise = require('promise');
const facebookAnalyticsClient = require('../clients/facebook/FacebookAnalyticsClient');

module.exports = {
    // ---------------------------------------------------------------------------------- mutations

  createOrReplaceSite(args, res){ // eslint-disable-line no-unused-vars
  },

  modifyFacebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  removeFacebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  modifyTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  removeTrustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  modifyTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  removeTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  modifyBlacklist(args, res){ // eslint-disable-line no-unused-vars
  },

  removeBlacklist(args, res){ // eslint-disable-line no-unused-vars
  },

    // ------------------------------------------------------------------------------------ queries

  sites(args, res){ // eslint-disable-line no-unused-vars
  },

  twitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  trustedTwitterAccounts(args, res){ // eslint-disable-line no-unused-vars
  },

  facebookPages(args, res){ // eslint-disable-line no-unused-vars
  },

  facebookAnalytics(args, res){ // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      const pageIds = ['aljazeera', 'microsoftvan']; // todo: fetch pages for args.siteId from sitesettings

      Promise.all(pageIds.map(pageId => ({Name: pageId, LastUpdated: facebookAnalyticsClient.fetchPageLastUpdatedAt(pageId), Count: -1})))
      .then(analytics => resolve({analytics}))
      .catch(err => reject(err));
    });
  },

  termBlacklist(args, res){ // eslint-disable-line no-unused-vars
  }
};
