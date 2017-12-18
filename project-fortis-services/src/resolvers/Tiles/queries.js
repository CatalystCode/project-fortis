'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, withRunTime, toConjunctionTopics } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const { computeWeightedAvg } = require('../../utils/collections');
const { requiresRole } = require('../../auth');

const DETAIL_ZOOM_LEVEL = 5;

function heatmapToFeatures(tiles) {
  const type = 'Point';

  return tiles.map(tile => {
    const { row, column, zoom, id } = geotile.tileFromTileId(tile.heatmaptileid);
    const coordinates = [geotile.longitudeFromColumn(column, zoom), geotile.latitudeFromRow(row, zoom)];
    const properties = {
      mentions: tile.mentioncount,
      avgsentiment: computeWeightedAvg(tile.mentioncount, tile.avgsentimentnumerator),
      date: tile.perioddate,
      tile: { row, zoom, column, id }
    };

    return { properties, coordinates, type };
  });
}

function filterFeaturesByPlaceBbox(bbox, zoomLevel, features) {
  let filteredfeatures = features;

  if (bbox) {
    const placetiles = tilesForBbox(bbox, zoomLevel).map(tile => tile.id);

    filteredfeatures = features.filter(feature => {
      const tileid = feature.properties && feature.properties.tile && feature.properties.tile.id ? feature.properties.tile.id : '';

      return tileid && placetiles.indexOf(tileid) > -1;
    });
  }

  return filteredfeatures;
}

function queryHeatmapTilesByParentTile(args) {
  return new Promise((resolve, reject) => {
    const type = 'FeatureCollection';
    const query = `
    SELECT heatmaptileid, perioddate, mentioncount, avgsentimentnumerator
    FROM fortis.heatmap
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND perioddate <= ?
    AND perioddate >= ?
    AND tileid = ?
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.zoomLevel,
      args.pipelinekeys,
      args.externalsourceid,
      args.toDate,
      args.fromDate,
      args.tileid
    ];

    cassandraConnector.executeQuery(query, params)
      .then(rows => {
        const heatmapfeatures = heatmapToFeatures(rows);

        resolve({
          type: type,
          features: [].concat.apply([], filterFeaturesByPlaceBbox(args.bbox, args.zoomLevel + DETAIL_ZOOM_LEVEL, heatmapfeatures))
        });
      })
      .catch(reject);
  });
}

function heatmapFeaturesByTile(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    queryHeatmapTilesByParentTile(args)
      .then(features => resolve(features))
      .catch(reject);
  });
}

function fetchTileIdsByPlaceId(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    featureServiceClient.fetchById(args.placeid, 'bbox')
      .then(places => {
        const tileIds = places.length ? tilesForBbox(places[0].bbox, args.zoomLevel) : [];
        resolve(tileIds);
      })
      .catch(reject);
  });
}

module.exports = {
  heatmapFeaturesByTile: requiresRole(trackEvent(withRunTime(heatmapFeaturesByTile), 'heatmapFeaturesByTile'), 'user'),
  fetchTileIdsByPlaceId: requiresRole(trackEvent(withRunTime(fetchTileIdsByPlaceId), 'fetchTileIdsByPlaceId'), 'user')
};
