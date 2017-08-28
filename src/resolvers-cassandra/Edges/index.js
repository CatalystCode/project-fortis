'use strict';

const queries = require('./queries');

module.exports = {
  topLocations: queries.popularLocations,
  timeSeries: queries.timeSeries,
  topSources: queries.topSources,
  topTerms: queries.topTerms,
  conjunctiveTerms: queries.conjunctiveTopics
};
