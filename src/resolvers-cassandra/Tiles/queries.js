'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const Long = require('cassandra-driver').types.Long;
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, withRunTime, toConjunctionTopics } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const { computeWeightedAvg } = require('../../utils/collections');

/**
 * @param {{tilex: number, tiley: number, tilez: number, avgsentimentnumerator: number, mentioncount: number}} rows
 */
function heatmapToFeatures(feature) {
  const heatmap = feature.heatmap ? JSON.parse(feature.heatmap) : {};
  const tileIds = Object.keys(heatmap);
  const type = 'Point';
  
  return tileIds.map(id => {
    const { mentioncountagg, avgsentimentagg } = heatmap[id];
    const mentions = Long.fromInt(mentioncountagg);
    const avgsentiment = Long.fromInt(avgsentimentagg);
    const date = feature.periodstartdate;
    const { row, column, zoom } = geotile.tileFromTileId(id);
    const coordinates = [geotile.longitudeFromColumn(column, zoom), geotile.latitudeFromRow(row, zoom)];
    const properties = {
      mentions: mentioncountagg,
      avgsentiment: computeWeightedAvg(mentions, avgsentiment),
      date: date,
      tile: { row, zoom, column, id }
    };

    return { properties, coordinates, type };
  });
}

function queryHeatmapTilesByParentTile(args) {
  return new Promise((resolve, reject) => {
    const type = 'FeatureCollection';
    const query = `
    SELECT heatmap, periodstartdate
    FROM fortis.heatmap
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND tilex = ?
    AND tiley = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (periodstartdate, periodenddate) <= (?, ?)
    AND (periodstartdate, periodenddate) >= (?, ?)
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.zoomLevel,
      args.tilex,
      args.tiley,
      args.pipelinekeys,
      args.externalsourceid,
      args.toDate,
      args.toDate,
      args.fromDate,
      args.fromDate
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => resolve({
      type: type,
      features: [].concat.apply([], rows.map(heatmapToFeatures))
    }))
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], zoomLevel: number, sourceFilter: string[], fromDate: string, toDate: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function heatmapFeaturesByTile(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {    
    queryHeatmapTilesByParentTile(args)
    .then(features => resolve(features) )
    .catch(reject);
  });
}

/**
 * @param {{placeid: String, zoomLevel: int}} args
 * @returns {Promise.<{[tile]>}>}
 */
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
  heatmapFeaturesByTile: trackEvent(withRunTime(heatmapFeaturesByTile), 'heatmapFeaturesByTile'),
  fetchTileIdsByPlaceId: trackEvent(withRunTime(fetchTileIdsByPlaceId), 'fetchTileIdsByPlaceId')
};
