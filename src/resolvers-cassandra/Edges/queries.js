'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/featureServiceClient');
const withRunTime = require('../shared').withRunTime;

function makeSiteBboxQuery(args) {
  return {
    query: 'SELECT geofence FROM sitesettings WHERE sitename = ?',
    params: [args.site]
  };
}

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
  return new Promise((resolve, reject) => {
    if (!args || !args.site) return reject('No site specified for which to lookup locations');

    const siteQuery = makeSiteBboxQuery(args);
    cassandraConnector.executeQuery(siteQuery.query, siteQuery.params)
    .then(rows => {
      if (!rows || !rows.length) return reject(`No geofence configured for site ${args.site}`);
      if (rows.length > 1) return reject(`More than one geofence configured for site ${args.site}`);
      if (!rows[0].geofence || rows[0].geofence.length !== 4) return reject(`Bad geofence for site ${args.site}`);

      const bbox = rows[0].geofence;
      featureServiceClient.fetchByBbox({north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]})
      .then(locations => {
        resolve({
          edges: locations.map(location => ({name: location.name, coordinates: location.bbox}))
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
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
