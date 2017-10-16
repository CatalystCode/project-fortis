'use strict';

const mutations = require('./mutations');
const queries = require('./queries');

module.exports = {
  createSite: mutations.createSite,
  removeSite: mutations.removeSite,
  editSite: mutations.editSite,
  modifyStreams: mutations.modifyStreams,
  modifyFacebookPages: mutations.modifyFacebookPages,
  removeFacebookPages: mutations.removeFacebookPages,
  modifyTrustedTwitterAccounts: mutations.modifyTrustedTwitterAccounts,
  removeTrustedTwitterAccounts: mutations.removeTrustedTwitterAccounts,
  modifyTwitterAccounts: mutations.modifyTwitterAccounts,
  removeTwitterAccounts: mutations.removeTwitterAccounts,
  modifyBlacklist: mutations.modifyBlacklist,
  removeBlacklist: mutations.removeBlacklist,
  removeKeywords: mutations.removeKeywords,
  addKeywords: mutations.addKeywords,
  addTrustedSources: mutations.addTrustedSources,
  removeTrustedSources: mutations.removeTrustedSources,

  siteTerms: queries.siteTerms,
  sites: queries.sites,
  trustedSources: queries.trustedSources,
  streams: queries.streams,
  twitterAccounts: queries.twitterAccounts,
  trustedTwitterAccounts: queries.trustedTwitterAccounts,
  facebookPages: queries.facebookPages,
  facebookAnalytics: queries.facebookAnalytics,
  termBlacklist: queries.termBlacklist
};
