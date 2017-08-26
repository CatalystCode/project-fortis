'use strict';

const queries = require('./queries');

module.exports = {
  locations: queries.locations,
  popularLocations: queries.popularLocations,
  timeSeries: queries.timeSeries,
  topSources: queries.topSources
};
