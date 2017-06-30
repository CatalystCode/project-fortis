'use strict';

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
  fetchTilesByBBox: fetchTilesByBBox,
  fetchTilesByLocations: fetchTilesByLocations,
  fetchPlacesByBBox: fetchPlacesByBBox,
  fetchEdgesByLocations: fetchEdgesByLocations,
  fetchEdgesByBBox: fetchEdgesByBBox
};
