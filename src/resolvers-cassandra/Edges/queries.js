'use strict';

const Promise = require('promise');
const Long = require('cassandra-driver').types.Long;
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, withRunTime, toConjunctionTopics, fromTopicListToConjunctionTopics } = require('../shared');
const { makeSet, makeMap, aggregateBy } = require('../../utils/collections');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');

const MaxFetchedRows = 10000;
const MinMentionCount = 1;
const MaxMentionCount = 1000000000;

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, bbox: [Float]}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, placeid: string, avgsentiment: float}>}>}
 */
function popularLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const fetchSize = 400;
    const responseSize = args.limit || 5;
    const [north, west, south, east] = args.bbox;

    const query = `
    SELECT mentioncount, placeid, mentioncount, avgsentimentnumerator, centroidlat, centroidlon
    FROM fortis.popularplaces
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (periodstartdate, periodenddate, centroidlat, centroidlon) <= (?, ?, ?, ?)
    AND (periodstartdate, periodenddate, centroidlat, centroidlon) >= (?, ?, ?, ?)
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.pipelinekeys,
      args.externalsourceid,
      args.toDate,
      args.toDate,
      north,
      east,
      args.fromDate,
      args.fromDate,
      south,
      west,
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
    .then(rows => {
      const placeIds = Array.from(makeSet(rows, row => row.placeid));
      featureServiceClient.fetchById(placeIds)
      .then(features => {
        const placeIdToFeature = makeMap(features, feature => feature.id, feature => feature);
        const edges = rows.map(row => ({
          name: placeIdToFeature[row.placeid].name,
          mentioncount: row.mentioncount,
          layer: placeIdToFeature[row.placeid].layer,
          placeid: row.placeid,
          avgsentimentnumerator: row.avgsentimentnumerator,
          coordinates: [row.centroidlat, row.centroidlon]
        }));

        resolve({
          edges: aggregateBy(edges, row => `${row.placeid}`, row => ( { 
            name: row.name,
            coordinates: row.coordinates,
            placeid: row.placeid,
            mentions: Long.ZERO, 
            layer: row.layer,
            avgsentimentnumerator: Long.ZERO 
          } ) )
        .slice(0, responseSize)
        });
      })
    .catch(reject);
    });
  });
}

/**
 * @param {{fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, maintopics: [String]!, conjunctivetopics: [String], bbox: [Float], zoomLevel: Int, externalsourceid: String!}} args
 * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
 */
function timeSeries(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.column);
    const tiley = makeSet(tiles, tile => tile.row);
    const conjunctivetopics = args.maintopics.length > 1 ? [] : args.conjunctivetopics;
    const MaxConjunctiveTopicsAllowed = 2;

    const query = `
    SELECT conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, periodstartdate, mentioncount, avgsentimentnumerator
    FROM fortis.timeseries
    WHERE periodtype = ?
    AND conjunctiontopic1 IN ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    `.trim();

    const params = [
      args.periodType,
      args.maintopics,//handle case for including popular terms in time series
      ...fromTopicListToConjunctionTopics(conjunctivetopics, MaxConjunctiveTopicsAllowed),
      args.zoomLevel,
      args.pipelinekeys,
      args.externalsourceid,
      Math.max(...tilex),
      Math.max(...tiley),
      args.toDate,
      args.toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      args.fromDate,
      args.fromDate
    ];

    return cassandraConnector.executeQuery(query, params)
    .then(rows => {
      const labels = Array.from(makeSet(rows, row => row.conjunctiontopic1)).map(row=>( { name: row}));
      const graphData = aggregateBy(rows, row => `${row.conjunctiontopic1}_${row.periodstartdate}`, row => ( { 
        date: row.periodstartdate, 
        name: row.conjunctiontopic1, 
        mentions: Long.ZERO, 
        avgsentimentnumerator: Long.ZERO 
      } ) );
      resolve({
        labels,
        graphData
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, bbox: [Float], zoomLevel: Int}} args
 * @returns {Promise.<{edges: Array<{name: string, mentions: number, avgsentiment: float}>}>}
 */
function topTerms(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.column);
    const tiley = makeSet(tiles, tile => tile.row);
    const fetchSize = 400;
    const responseSize = args.limit || 5;

    const query = `
    SELECT mentioncount, conjunctiontopic1, avgsentimentnumerator
    FROM fortis.populartopics
    WHERE periodtype = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (mentioncount, tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?, ?)
    AND (mentioncount, tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?, ?)
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      args.zoomLevel,
      args.pipelinekeys,
      args.externalsourceid,
      MaxMentionCount,
      Math.max(...tilex),
      Math.max(...tiley),
      args.toDate,
      args.toDate,
      MinMentionCount,
      Math.min(...tilex),
      Math.min(...tiley),
      args.fromDate,
      args.fromDate,
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
    .then(rows => 
      resolve({
        edges: aggregateBy(rows, row => `${row.conjunctiontopic1}`, row => ( { 
          name: row.conjunctiontopic1, 
          mentions: Long.ZERO, 
          avgsentimentnumerator: Long.ZERO 
        } ) )
        .slice(0, responseSize)
      })
    )
    .catch(reject);
  });
}

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function topSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.column);
    const tiley = makeSet(tiles, tile => tile.row);
    const fetchSize = 400;
    const responseSize = args.limit || 5;

    const query = `
    SELECT mentioncount, pipelinekey, externalsourceid, avgsentimentnumerator
    FROM fortis.popularsources
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND (mentioncount, tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?, ?)
    AND (mentioncount, tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?, ?)
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.zoomLevel,
      args.pipelinekeys,
      MaxMentionCount,
      Math.max(...tilex),
      Math.max(...tiley),
      args.toDate,
      args.toDate,
      MinMentionCount,
      Math.min(...tilex),
      Math.min(...tiley),
      args.fromDate,
      args.fromDate,
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
    .then(rows => {
      const filteredRows = rows.filter(row=>row.pipelinekey !== 'all' && row.externalsourceid !== 'all');//filter all aggregates as we're interested in named sources only
      const edges = aggregateBy(filteredRows, row => `${row.pipelinekey}_${row.externalsourceid}`, row => ( { 
        pipelinekey: row.pipelinekey, 
        name: row.externalsourceid, 
        mentions: Long.ZERO, 
        avgsentimentnumerator: Long.ZERO 
      } ) )
      .slice(0, responseSize);

      resolve({
        edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, maintopic: String!, bbox: [Float], zoomLevel: Int!}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function conjunctiveTopics(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.column);
    const tiley = makeSet(tiles, tile => tile.row);
    const fetchSize = 400;

    const query = `
    SELECT mentioncount, conjunctivetopic, topic
    FROM fortis.conjunctivetopics
    WHERE periodtype = ?
    AND topic = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      args.maintopic,
      args.zoomLevel,
      args.pipelinekeys,
      args.externalsourceid,
      Math.max(...tilex),
      Math.max(...tiley),
      args.toDate,
      args.toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      args.fromDate,
      args.fromDate,
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
    .then(rows => {
      console.log('results');
      console.log(rows);
      //todo: need to add sentiment field to the conjunctivetopics table
      const edges = aggregateBy(rows, row => `${row.conjunctivetopic}`, row => ( { 
        conjunctionterm: row.conjunctivetopic, 
        name: row.topic, 
        mentions: Long.ZERO
      } ) );

      resolve({
        edges
      });
    })
    .catch(reject);
  });
}

module.exports = {
  popularLocations: trackEvent(withRunTime(popularLocations), 'popularLocations'),
  timeSeries: trackEvent(timeSeries, 'timeSeries'),
  topTerms: trackEvent(topTerms, 'topTerms'),
  conjunctiveTopics: trackEvent(conjunctiveTopics, 'conjunctiveTopics'),
  topSources: trackEvent(topSources, 'topSources')
};
