'use strict';

const mutations = require('./mutations');
const queries = require('./queries');

module.exports = {
  createSite: mutations.createSite,
  removeSite: mutations.removeSite,
  modifyFacebookPages: mutations.modifyFacebookPages,
  removeFacebookPages: mutations.removeFacebookPages,
  modifyTrustedTwitterAccounts: mutations.modifyTrustedTwitterAccounts,
  removeTrustedTwitterAccounts: mutations.removeTrustedTwitterAccounts,
  modifyTwitterAccounts: mutations.modifyTwitterAccounts,
  removeTwitterAccounts: mutations.removeTwitterAccounts,
  modifyBlacklist: mutations.modifyBlacklist,
  removeBlacklist: mutations.removeBlacklist,

  sites: queries.sites,
  twitterAccounts: queries.twitterAccounts,
  trustedTwitterAccounts: queries.trustedTwitterAccounts,
  facebookPages: queries.facebookPages,
  facebookAnalytics: queries.facebookAnalytics,
  termBlacklist: queries.termBlacklist
};
