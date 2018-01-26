'use strict';

const mutations = require('./mutations');
const queries = require('./queries');

module.exports = {
  addUsers: mutations.addUsers,
  removeUsers: mutations.removeUsers,
  removeSite: mutations.removeSite,
  editSite: mutations.editSite,
  modifyStreams: mutations.modifyStreams,
  modifyBlacklist: mutations.modifyBlacklist,
  removeBlacklist: mutations.removeBlacklist,
  removeKeywords: mutations.removeKeywords,
  addKeywords: mutations.addKeywords,
  addTrustedSources: mutations.addTrustedSources,
  removeTrustedSources: mutations.removeTrustedSources,

  exportSite: queries.exportSite,
  users: queries.users,
  siteTerms: queries.siteTerms,
  sites: queries.sites,
  trustedSources: queries.trustedSources,
  streams: queries.streams,
  termBlacklist: queries.termBlacklist
};
