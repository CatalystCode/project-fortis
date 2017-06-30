'use strict';

const queries = require('./queries');
const mutations = require('./mutations');

module.exports = {
  removeKeywords: mutations.removeKeywords,
  addKeywords: mutations.addKeywords,
  saveLocations: mutations.saveLocations,
  removeLocations: mutations.removeLocations,

  terms: queries.terms,
  locations: queries.locations,
  popularLocations: queries.popularLocations,
  timeSeries: queries.timeSeries,
  topSources: queries.topSources
};
