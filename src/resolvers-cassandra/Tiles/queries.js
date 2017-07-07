'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;
const { makeMap, makeSet } = require('../../utils/collections');

function makeDefaultFilters(args) {
  let params = [];
  let clauses = [];

  const keywords = (args.filteredEdges || []).concat(args.mainEdge ? [args.mainEdge] : []);
  if (keywords.length) {
    clauses.push(`(keyword IN (${keywords.map(_ => '?').join(', ')}))`); // eslint-disable-line no-unused-vars
    params = params.concat(keywords);
  }

  if (args.sourceFilter && args.sourceFilter.length) {
    clauses.push(`(pipeline IN (${args.sourceFilter.map(_ => '?').join(', ')}))`); // eslint-disable-line no-unused-vars
    params = params.concat(args.sourceFilter);
  }

  if (args.fromDate) {
    clauses.push('(periodstartdate >= ?)');
    params.push(args.fromDate);
  }

  if (args.toDate) {
    clauses.push('(periodenddate <= ?)');
    params.push(args.toDate);
  }

  if (args.timespan) {
    clauses.push('(periodtype = ?)');
    params.push(args.timespan);
  }

  return {clauses: clauses, params: params};
}

function makeTilesQuery(args, tileIds) {
  const {clauses, params} = makeDefaultFilters(args);

  tileIds.forEach(tileId => {
    clauses.push('(tileid = ?)');
    params.push(tileId);
  });

  const query = `SELECT tileid, computedfeatures, topic FROM computedtiles WHERE ${clauses.join(' AND ')}`;
  return {query: query, params: params};
}

function makeLocationsQuery(args, locationIds) {
  let {clauses, params} = makeDefaultFilters(args);

  clauses.push(`(${locationIds.map(_ => '(placeids CONTAINS ?)').join(' OR ')})`); // eslint-disable-line no-unused-vars
  params = params.concat(locationIds);

  const query = `SELECT tileid, computedfeatures, topic FROM computedtiles WHERE ${clauses.join(' AND ')}`;
  return {query: query, params: params};
}

function tileIdsForBbox(bbox, zoomLevel) {
  const fence = {north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]};
  return geotile.tileIdsForBoundingBox(fence, zoomLevel);
}

function fetchLocationIdsForPoints(points) {
  return new Promise((resolve, reject) => {
    Promise.all(points.map(point => featureServiceClient.fetchByPoint({latitude: point[0], longitude: point[1]})))
    .then(locations => {
      const locationIds = makeSet(locations, location => location.id);
      resolve(locationIds);
    })
    .catch(reject);
  });
}

function cassandraRowsToEdges(rows) {
  const rowsByTileId = makeMap(rows, row => row.tileid, row => row);
  return Object.keys(rowsByTileId).map(tileId => {
    const row = rowsByTileId[tileId];
    return {
      mentionCount: row.computedfeatures && row.computedfeatures.mentions,
      name: row.topic
    };
  });
}

function cassandraRowsToFeatures(rows) {
  const rowsByTileId = makeMap(rows, row => row.tileid, row => row);
  return Object.keys(rowsByTileId).map(tileId => {
    const row = rowsByTileId[tileId];
    return {
      properties: {
        pos_sentiment: row.computedfeatures && row.computedfeatures.sentiment && row.computedfeatures.sentiment.pos_avg,
        neg_sentiment: row.computedfeatures && row.computedfeatures.sentiment && row.computedfeatures.sentiment.neg_avg,
        mentionCount: row.computedfeatures && row.computedfeatures.mentions,
        tileId: tileId
      }
    };
  });
}

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], timespan: string, zoomLevel: number, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch tiles specified');
    if (!args || !args.zoomLevel) return reject('No zoom level for which to fetch tiles specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch tiles specified');

    const tileIds = tileIdsForBbox(args.bbox, args.zoomLevel);
    const query = makeTilesQuery(args, tileIds);
    cassandraConnector.executeQuery(query.query, query.params)
    .then(rows => {
      const features = cassandraRowsToFeatures(rows);
      resolve({
        features: features
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], filteredEdges: string[], timespan: string, layertype: string, sourceFilter: string, fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.locations || !args.locations.length) return reject('No locations specified for which to fetch tiles');
    if (args.locations.some(loc => loc.length !== 2)) return reject('Invalid locations specified to fetch tiles');

    fetchLocationIdsForPoints(args.locations)
    .then(locationIds => {
      const query = makeLocationsQuery(args, locationIds);
      cassandraConnector.executeQuery(query.query, query.params)
      .then(rows => {
        const features = cassandraRowsToFeatures(rows);
        resolve({
          features: features
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], zoom: number, populationMin: number, populationMax: number}} args
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
 * @param {{site: string, locations: number[][], timespan: string, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.locations || !args.locations.length) return reject('No locations specified for which to fetch edges');
    if (args.locations.some(loc => loc.length !== 2)) return reject('Invalid locations specified to fetch edges');

    fetchLocationIdsForPoints(args.locations)
    .then(locationIds => {
      const query = makeLocationsQuery(args, locationIds);
      cassandraConnector.executeQuery(query.query, query.params)
      .then(rows => {
        const edges = cassandraRowsToEdges(rows);
        resolve({
          edges: edges
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], zoomLevel: number, mainEdge: string, timespan: string, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch edges specified');
    if (!args || !args.zoomLevel) return reject('No zoom level for which to fetch edges specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch edges specified');

    const tileIds = tileIdsForBbox(args.bbox, args.zoomLevel);
    const query = makeTilesQuery(args, tileIds);
    cassandraConnector.executeQuery(query.query, query.params)
    .then(rows => {
      const edges = cassandraRowsToEdges(rows);
      resolve({
        edges: edges
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
