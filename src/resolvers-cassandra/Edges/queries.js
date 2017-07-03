'use strict';

const withRunTime = require('../shared').withRunTime;

/**
 * @param {{site: string, query: string, fromDate: string, toDate: string, sourceFilter: string[]}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function terms(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, query: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, coordinates: number[]}>}>}
 */
function locations(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, langCode: string, limit: number, timespan: string, zoomLevel: number, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, coordinates: number[], population: number}>}>}
 */
function popularLocations(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, fromDate: string, toDate: string, zoomLevel: number, limit: number, layertype: string, sourceFilter: string[], mainEdge: string}} args
 * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
 */
function timeSeries(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, fromDate: string, toDate: string, limit: number, mainTerm: string, sourceFilter: string[]}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function topSources(args,res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  terms: withRunTime(terms),
  locations: withRunTime(locations),
  popularLocations: withRunTime(popularLocations),
  timeSeries: timeSeries,
  topSources: topSources
};
