'use strict';

const queries = require('./queries');

module.exports = {
  topLocations: queries.popularLocations,
  timeSeries: queries.timeSeries,
  topSources: queries.topSources,
  topTerms: queries.topTerms,
  geofenceplaces: queries.geofenceplaces,
  conjunctiveTerms: queries.conjunctiveTopics,

  csv_topLocations: queries.csv_popularLocations,
  csv_timeSeries: queries.csv_timeSeries,
  csv_topSources: queries.csv_topSources,
  csv_topTerms: queries.csv_topTerms,
  csv_geofenceplaces: queries.csv_geofenceplaces,
  csv_conjunctiveTerms: queries.csv_conjunctiveTopics
};
