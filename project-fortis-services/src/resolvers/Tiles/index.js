'use strict';

const queries = require('./queries');

module.exports = {
  heatmapFeaturesByTile: queries.heatmapFeaturesByTile,
  fetchTileIdsByPlaceId: queries.fetchTileIdsByPlaceId
};
