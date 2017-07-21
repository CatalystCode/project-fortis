'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { withRunTime } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const { makeSet } = require('../../utils/collections');

function tilesForBbox(bbox, zoomLevel) {
  const fence = {north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]};
  return geotile.tileIdsForBoundingBox(fence, zoomLevel).map(geotile.decodeTileId);
}

function toPipelineKey(sourceFilter) {
  if (!sourceFilter || !sourceFilter.length) {
    return 'all';
  }

  if (sourceFilter.length > 1) {
    console.warn(`Only one source filter supported, ignoring: ${sourceFilter.slice(1).join(', ')}`);
  }

  return sourceFilter[0];
}

function toConjunctionTopics(mainEdge, filteredEdges) {
  const selectedFilters = [];
  if (filteredEdges[0] && filteredEdges[1]) {
    selectedFilters.push(filteredEdges[0], filteredEdges[1]);
    selectedFilters.sort();
  } else if (filteredEdges[0]) {
    selectedFilters.push(filteredEdges[0]);
    selectedFilters.push('');
  } else if (filteredEdges[1]) {
    selectedFilters.push(filteredEdges[1]);
    selectedFilters.push('');
  } else {
    selectedFilters.push('');
    selectedFilters.push('');
  }

  if (filteredEdges.length > 2) {
    console.warn(`Only two filtered edges supported, ignoring: ${filteredEdges.slice(2).join(', ')}`);
  }

  return [mainEdge].concat(selectedFilters);
}

/**
 * @param {{tilex: number, tiley: number, tilez: number, avgsentiment: number, mentioncount: number}} rows
 */
function computedtileToTile(row) {
  const coordinates = [geotile.longitudeFromColumn(row.tiley, row.tilez), geotile.latitudeFromRow(row.tilex, row.tilez)];
  const mentionCount = row.mentioncount;
  const neg_sentiment = row.avgsentiment;
  const tileId = geotile.tileIdFromRowColumn(row.tilex, row.tiley, row.tilez);

  return {
    coordinates,
    mentionCount,
    neg_sentiment,
    tileId
  };
}

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], zoomLevel: number, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch tiles specified');
    if (!args || !args.zoomLevel) return reject('No zoom level for which to fetch tiles specified');
    if (!args || !args.mainEdge) return reject('No main edge for keyword filter specified');
    if (!args || !args.filteredEdges) return reject('No secondary edges for keyword filter specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch tiles specified');

    const tiles = tilesForBbox(args.bbox, args.zoomLevel);

    // FIXME can't filter by both periodstartdate>= and periodenddate<=, https://stackoverflow.com/a/33879423/3817588
    const query = `
    SELECT tilex, tiley, tilez, avgsentiment, mentioncount
    FROM fortis.computedtiles
    WHERE periodtype = ?
    AND conjunctiontopics = ?
    AND tilez = ?
    AND period = ?
    AND tilex IN ?
    AND tiley IN ?
    AND periodstartdate >= ?
    AND periodenddate <= ?
    AND pipelinekey = ?
    `.trim();

    const params = [
      '', // TODO periodtype
      toConjunctionTopics(args.mainEdge, args.filteredEdges),
      args.zoomLevel,
      '', // TODO period
      makeSet(tiles, tile => tile.row),
      makeSet(tiles, tile => tile.column),
      args.fromDate,
      args.toDate,
      toPipelineKey(args.sourceFilter)
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      resolve({
        bbox: args.bbox,
        features: rows.map(computedtileToTile)
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], filteredEdges: string[], timespan: string, sourceFilter: string, fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.locations || !args.locations.length) return reject('No locations specified for which to fetch tiles');
    if (args.locations.some(loc => loc.length !== 2)) return reject('Invalid locations specified to fetch tiles');

    // FIXME this requires a zoomLevel so we can query computedtiles by tilez
    // FIXME this requires a mainEdge so that we can query computedtiles by conjunctiontopics
    throw new Error('not supported');
  });
}

/**
 * @param {{site: string, bbox: number[], zoom: number}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{coordinate: number[], name: string, id: string, population: number, kind: string, tileId: string, source: string>}>}
 */
function fetchPlacesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch places specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch places specified');

    featureServiceClient.fetchByBbox({north: args.bbox[0], west: args.bbox[1], south: args.bbox[2], east: args.bbox[3]})
    .then(places => {
      const features = places.map(place => ({coordinate: place.bbox, name: place.name, id: place.id}));
      resolve({
        features: features,
        bbox: args.bbox
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], timespan: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.locations || !args.locations.length) return reject('No locations specified for which to fetch edges');
    if (args.locations.some(loc => loc.length !== 2)) return reject('Invalid locations specified to fetch edges');

    throw new Error('not supported');
  });
}

/**
 * @param {{mentionCount: number, topic: string}} row 
 */
function populartopicToEdge(row) {
  const mentionCount = row.mentionCount;
  const name = row.topic;

  return {
    mentionCount,
    name
  };
}

/**
 * @param {{site: string, bbox: number[], zoomLevel: number, mainEdge: string, timespan: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch edges specified');
    if (!args || !args.zoomLevel) return reject('No zoom level for which to fetch edges specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch edges specified');

    const tiles = tilesForBbox(args.bbox, args.zoomLevel);

    // FIXME can't filter by both periodstartdate>= and periodenddate<=, https://stackoverflow.com/a/33879423/3817588
    const query = `
    SELECT mentionCount, topic
    FROM populartopics
    WHERE periodtype = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND tilez = ?
    AND topic = ?
    AND period = ?
    AND tilex IN ?
    AND tiley IN ?
    AND periodstartdate >= ?
    AND periodenddate <= ?
    `.trim();

    const params = [
      '', // TODO periodtype
      toPipelineKey(args.sourceFilter),
      '', // FIXME this doesn't have externalsourceid
      args.zoomLevel,
      '', // FIXME this doesn't have topic
      '', // TODO period
      makeSet(tiles, tile => tile.row),
      makeSet(tiles, tile => tile.column),
      args.fromDate,
      args.toDate
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      resolve({
        edges: rows.map(populartopicToEdge)
      });
    })
    .catch(reject);
  });
}

module.exports = {
  fetchTilesByBBox: trackEvent(withRunTime(fetchTilesByBBox), 'fetchTilesByBBox'),
  fetchTilesByLocations: trackEvent(withRunTime(fetchTilesByLocations), 'fetchTilesByLocations'),
  fetchPlacesByBBox: trackEvent(withRunTime(fetchPlacesByBBox), 'fetchPlacesByBBox'),
  fetchEdgesByLocations: trackEvent(withRunTime(fetchEdgesByLocations), 'fetchEdgesByLocations'),
  fetchEdgesByBBox: trackEvent(withRunTime(fetchEdgesByBBox, 'fetchEdgesByBBox'))
};
