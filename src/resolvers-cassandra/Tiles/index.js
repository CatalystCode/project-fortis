'use strict';

const queries = require('./queries');

module.exports = {
  fetchTilesByBBox: queries.fetchTilesByBBox,
  fetchTilesByLocations: queries.fetchTilesByLocations,
  fetchPlacesByBBox: queries.fetchPlacesByBBox,
  fetchEdgesByLocations: queries.fetchEdgesByLocations,
  fetchEdgesByBBox: queries.fetchEdgesByBBox
};
