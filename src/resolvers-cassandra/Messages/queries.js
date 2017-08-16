'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const { parseFromToDate, parseLimit, withRunTime, toPipelineKey, toConjunctionTopics, limitForInClause } = require('../shared');
const { makeSet } = require('../../utils/collections');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

function eventToFeature(row) {
  return {
    type: row.pipelinekey,
    coordinates: [],
    properties: {
      edges: row.topics,
      messageid: row.eventid,
      createdtime: row.event_time,
      sentiment: row.computedfeatures && row.computedfeatures.sentiment,
      title: row.title,
      originalSources: row.externalsourceid,
      language: row.eventlangcode,
      source: row.sourceurl,
      fullText: row.messagebody
    }
  };
}

function queryEventsTable(rowsWithEventIds, args) {
  return new Promise((resolve, reject) => {
    const eventIds = makeSet(rowsWithEventIds, row => row.eventid);

    if (!eventIds.size) {
      return reject('No events matched the query');
    }

    let eventsQuery = `
    SELECT *
    FROM fortis.events
    WHERE pipelinekey = ?
    AND eventid IN ?
    `.trim();

    const eventsParams = [
      toPipelineKey(args.sourceFilter),
      limitForInClause(eventIds)
    ];

    if (args.fulltextTerm) {
      eventsQuery += ' AND fulltext LIKE ?';
      eventsParams.push(`%${args.fulltextTerm}%`);
    }

    const limit = parseLimit(args.limit);
    if (limit) {
      eventsQuery += ' LIMIT ?';
      eventsParams.push(limit);
    }

    cassandraConnector.executeQuery(eventsQuery, eventsParams)
    .then(rows => {
      const features = rows.map(eventToFeature);

      resolve({
        features
      });
    })
    .catch(reject);
  });
}

/**
 * @param {site: string, originalSource: string, coordinates: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byLocation(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.coordinates || args.coordinates.length !== 2) return reject('Invalid coordinates specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const [lat, lon] = args.coordinates;

    const tagsQuery = `
    SELECT eventid
    FROM fortis.eventplaces
    WHERE conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND centroidlat = ?
    AND centroidlon = ?
    AND eventtime >= ?
    AND eventtime <= ?
    LIMIT ?
    `.trim();

    const tagsParams = [
      ...toConjunctionTopics(args.mainTerm, args.filteredEdges),
      toPipelineKey(args.sourceFilter),
      'all',
      lat,
      lon,
      fromDate,
      toDate,
      parseLimit(args.limit)
    ];

    cassandraConnector.executeQuery(tagsQuery, tagsParams)
    .then(rows => {
      return queryEventsTable(rows, args);
    })
    .then(resolve)
    .catch(reject);
  });
}

/**
 * @param {site: string, originalSource: string, bbox: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byBbox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.bbox || args.bbox.length !== 4) return reject('Invalid bbox specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const [north, west, south, east] = args.bbox;

    const tagsQuery = `
    SELECT eventid
    FROM fortis.eventplaces
    WHERE conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND (centroidlat, centroidlon, eventtime) <= (?, ?, ?)
    AND (centroidlat, centroidlon, eventtime) >= (?, ?, ?)
    LIMIT ?
    `.trim();

    const tagsParams = [
      ...toConjunctionTopics(args.mainTerm, args.filteredEdges),
      toPipelineKey(args.sourceFilter),
      'all',
      north,
      east,
      fromDate,
      south,
      west,
      toDate,
      parseLimit(args.limit)
    ];

    cassandraConnector.executeQuery(tagsQuery, tagsParams)
    .then(rows => {
      return queryEventsTable(rows, args);
    })
    .then(resolve)
    .catch(reject);
  });
}

/**
 * @param {site: string, mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byEdges(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.filteredEdges || !args.filteredEdges.length) return reject('No edges by which to filter specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);

    const tagsQuery = `
    SELECT eventid
    FROM fortis.eventtopics
    WHERE topic IN ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND eventtime <= ?
    AND eventtime >= ?
    LIMIT ?
    `.trim();

    const tagsParams = [
      limitForInClause(toConjunctionTopics(args.mainTerm, args.filteredEdges).filter(topic => !!topic)),
      toPipelineKey(args.sourceFilter),
      'all',
      toDate,
      fromDate,
      parseLimit(args.limit)
    ];

    cassandraConnector.executeQuery(tagsQuery, tagsParams)
    .then(rows => {
      return queryEventsTable(rows, args);
    })
    .then(resolve)
    .catch(reject);
  });
}

/**
 * @param {{site: string, messageId: string}} args
 * @returns {Promise.<Feature>}
 */
function event(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.messageId) return reject('No event id to fetch specified');

    const eventQuery = `
    SELECT *
    FROM fortis.events
    WHERE eventid = ?
    LIMIT 2
    `.trim();

    const eventParams = [
      args.messageId
    ];

    cassandraConnector.executeQuery(eventQuery, eventParams)
    .then(rows => {
      if (!rows.length) return reject(`No event matching id ${args.messageId} found`);
      if (rows.length > 1) return reject(`Got more than one event with id ${args.messageId}`);

      const feature = eventToFeature(rows[0]);

      resolve(feature);
    })
    .catch(reject);
  });
}

/**
 * @param {{sentence: string, fromLanguage: string, toLanguage: string}} args
 * @returns {Promise.<{originalSentence: string, translatedSentence: string}>}
 */
function translate(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    translatorService.translate(args.sentence, args.fromLanguage, args.toLanguage)
    .then(result => {
      const translatedSentence = result.translatedSentence;
      const originalSentence = args.sentence;

      resolve({
        translatedSentence,
        originalSentence
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{words: string[], fromLanguage: string, toLanguage: string}} args
 * @returns {Promise.<{words: Array<{originalSentence: string, translatedSentence: string}>}>}
 */
function translateWords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    translatorService.translateSentenceArray(args.words, args.fromLanguage, args.toLanguage)
    .then(result => {
      const words = result.translatedSentence;

      resolve({
        words
      });
    })
    .catch(reject);
  });
}

module.exports = {
  byLocation: trackEvent(withRunTime(byLocation), 'messagesForLocation'),
  byBbox: trackEvent(withRunTime(byBbox), 'messagesForBbox'),
  byEdges: trackEvent(withRunTime(byEdges), 'messagesForEdges'),
  event: trackEvent(event, 'messageForEvent'),
  translate: trackEvent(translate, 'translate'),
  translateWords: trackEvent(translateWords, 'translateWords')
};
