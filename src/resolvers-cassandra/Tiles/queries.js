'use strict';

const Promise = require('promise');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const withRunTime = require('../shared').withRunTime;

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], timespan: string, zoomLevel: number, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByBBox(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, locations: number[][], filteredEdges: string[], timespan: string, layertype: string, sourceFilter: string, fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByLocations(args, res) { // eslint-disable-line no-unused-vars
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
}

/**
 * @param {{site: string, bbox: number[], zoomLevel: number, mainEdge: string, timespan: string, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByBBox(args, res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  fetchTilesByBBox: withRunTime(fetchTilesByBBox),
  fetchTilesByLocations: withRunTime(fetchTilesByLocations),
  fetchPlacesByBBox: withRunTime(fetchPlacesByBBox),
  fetchEdgesByLocations: withRunTime(fetchEdgesByLocations),
  fetchEdgesByBBox: withRunTime(fetchEdgesByBBox)
};
