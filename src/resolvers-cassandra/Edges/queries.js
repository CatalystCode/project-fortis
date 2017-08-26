'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, parseFromToDate, withRunTime, toPipelineKey, toConjunctionTopics } = require('../shared');
const { makeSet, makeMap, makeMultiMap } = require('../../utils/collections');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');

/**
 * @param {{site: string, timespan: string, sourceFilter: string[], mainEdge: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, coordinates: number[], population: number}>}>}
 */
function popularLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const { period, periodType, fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const [north, west, south, east] = args.bbox;

    const query = `
    SELECT placeid, mentioncount, centroidlat, centroidlon
    FROM fortis.popularplaces
    WHERE period = ?
    AND periodtype = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND (periodstartdate, periodenddate, centroidlat, centroidlon) <= (?, ?, ?, ?)
    AND (periodstartdate, periodenddate, centroidlat, centroidlon) >= (?, ?, ?, ?)
    `.trim();

    const params = [
      period,
      periodType,
      toPipelineKey(args.sourceFilter),
      args.originalSource || 'all',
      ...toConjunctionTopics(args.mainEdge),
      toDate,
      toDate,
      north,
      east,
      fromDate,
      fromDate,
      south,
      west
    ];

    return cassandraConnector.executeQuery(query, params)
    .then(rows => {
      const placeIds = Array.from(makeSet(rows, row => row.placeid));
      featureServiceClient.fetchById(placeIds)
      .then(features => {
        const placeIdToFeature = makeMap(features, feature => feature.id, feature => feature);
        const edges = rows.map(row => ({
          name: placeIdToFeature[row.placeid].name,
          mentions: row.mentioncount,
          coordinates: [row.centroidlat, row.centroidlon]
        }));

        resolve({
          edges
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, fromDate: string, toDate: string, sourceFilter: string[], mainEdge: string, bbox: number[], zoomLevel: number, originalSource: string}} args
 * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
 */
function timeSeries(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const { period, periodType, fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.row);
    const tiley = makeSet(tiles, tile => tile.column);

    const query = `
    SELECT conjunctiontopic1, periodstartdate, mentioncount
    FROM fortis.timeseries
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND period = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    `.trim();

    const params = [
      periodType,
      ...toConjunctionTopics(args.mainEdge),
      args.zoomLevel,
      period,
      toPipelineKey(args.sourceFilter),
      args.originalSource || 'all',
      Math.max(...tilex),
      Math.max(...tiley),
      toDate,
      toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      fromDate,
      fromDate
    ];

    return cassandraConnector.executeQuery(query, params)
    .then(rows => {
      const topicToCounts = makeMultiMap(rows, row => row.conjunctiontopic1, row => row.mentioncount);
      const labels = Object.keys(topicToCounts).map(topic => ({name: topic, mentions: topicToCounts[topic].reduce((a, b) => a + b, 0)}));
      const dateToRows = makeMultiMap(rows, row => row.periodstartdate, row => row);
      const graphData = Object.keys(dateToRows).map(date => ({date, edges: rows.map(row => row.conjunctiontopic1), mentions: rows.map(row => row.mentioncount)}));

      resolve({
        labels,
        graphData
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, fromDate: string, toDate: string, sourceFilter: string[], mainTerm: string, limit: number, bbox: number[], zoomLevel: number, originalSource: string}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function topSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const { period, periodType, fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.row);
    const tiley = makeSet(tiles, tile => tile.column);
    const limit = args.limit || 1000;

    const query = `
    SELECT mentioncount, pipelinekey
    FROM fortis.popularsources
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND externalsourceid = ?
    AND period = ?
    AND pipelinekey = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    LIMIT ?
    `.trim();

    const params = [
      periodType,
      ...toConjunctionTopics(args.mainTerm),
      args.zoomLevel,
      args.originalSource || 'all',
      period,
      toPipelineKey(args.sourceFilter),
      Math.max(...tilex),
      Math.max(...tiley),
      toDate,
      toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      fromDate,
      fromDate,
      limit
    ];

    return cassandraConnector.executeQuery(query, params)
    .then(rows => {
      const sources = rows.map(row => ({Name: row.pipelinekey, Count: row.mentioncount, Source: row.pipelinekey}));

      resolve({
        sources
      });
    })
    .catch(reject);
  });
}

module.exports = {
  popularLocations: trackEvent(withRunTime(popularLocations), 'popularLocations'),
  timeSeries: trackEvent(timeSeries, 'timeSeries'),
  topSources: trackEvent(topSources, 'topSources')
};
