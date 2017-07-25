'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { withRunTime, toPipelineKey } = require('../shared');
const { makeSet } = require('../../utils/collections');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');

/**
 * @param {{site: string, fromDate: string, toDate: string, sourceFilter: string[]}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function terms(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args) return reject('No args specified');

    const query = `
    SELECT topic
    FROM fortis.eventtags
    WHERE topic = ?
    AND pipelinekey = ?
    AND event_time = ?
    AND placecentroidcoordx = ?
    AND placecentroidcoordy = ?
    `.trim();

    const params = [
      '', // FIXME: no topic available
      toPipelineKey(args.sourceFilter),
      '', // FIXME: how to convert fromDate/toDate to event_time?
      '', // FIXME: no placecentroidcoordx available
      '' // FIXME: no placecentroidcoordy available
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      const keywords = makeSet(rows, row => row.topic);

      return {
        edges: keywords.map(keyword => ({name: keyword}))
      };
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, coordinates: number[]}>}>}
 */
function locations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.site) return reject('No site specified for which to lookup locations');

    const query = `
    SELECT geofence
    FROM fortis.sitesettings
    WHERE sitename = ?
    `.trim();

    const params = [
      args.sitename
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      if (!rows || !rows.length) return reject(`No geofence configured for site ${args.site}`);
      if (rows.length > 1) return reject(`More than one geofence configured for site ${args.site}`);
      if (!rows[0].geofence || rows[0].geofence.length !== 4) return reject(`Bad geofence for site ${args.site}`);

      const bbox = rows[0].geofence;
      return featureServiceClient.fetchByBbox({north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]});
    })
    .then(locations => {
      resolve({
        edges: locations.map(location => ({name: location.name, coordinates: location.bbox}))
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, timespan: string, sourceFilter: string[]}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, coordinates: number[], population: number}>}>}
 */
function popularLocations(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, fromDate: string, toDate: string, sourceFilter: string[], mainEdge: string}} args
 * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
 */
function timeSeries(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, fromDate: string, toDate: string, sourceFilter: string[], mainTerm: string, limit: number}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function topSources(args,res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  terms: trackEvent(withRunTime(terms), 'terms'),
  locations: trackEvent(withRunTime(locations), 'locations'),
  popularLocations: trackEvent(withRunTime(popularLocations), 'popularLocations'),
  timeSeries: trackEvent(timeSeries, 'timeSeries'),
  topSources: trackEvent(topSources, 'topSources')
};
