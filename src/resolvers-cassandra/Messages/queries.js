'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { withRunTime, toPipelineKey, toConjunctionTopics } = require('../shared');
const { makeSet, makeMap, makeMultiMap } = require('../../utils/collections');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

function eventToFeature(row) {
  return {
    type: row.pipelinekey,
    coordinates: [],
    properties: {
      edges: [],
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

/**
 * @param {site: string, originalSource: string, coordinates: number[], filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byLocation(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    return reject('Querying by location is no longer supported, please query using the place name instead');
  });
}

/**
 * @param {site: string, originalSource: string, bbox: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byBbox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.bbox || args.bbox.length !== 4) return reject('Invalid bbox specified');

    featureServiceClient.fetchByBbox({north: args.bbox[0], west: args.bbox[1], south: args.bbox[2], east: args.bbox[3]})
    .then(places => {
      const idToBbox = makeMap(places, place => place.id, place => place.bbox);
      const placeIds = Object.keys(idToBbox);

      const tagsQuery = `
      SELECT eventid
      FROM eventtags
      WHERE topic IN ?
      AND pipelinekey = ?
      AND event_time = ?
      AND placecentroidx = ?
      AND placecentroidy = ?
      AND eventid = ?
      AND placeid IN ?
      `.trim();

      const tagsParams = [
        toConjunctionTopics(args.mainTerm, args.filteredEdges),
        toPipelineKey(args.sourceFilter),
        '', // FIXME: how to convert formDate and toDate to event_time?
        '', // FIXME: no placecentroidx available
        '', // FIXME: no placecentroidy available
        '', // FIXME: no eventid available
        placeIds // FIXME: not part of primary key
      ];

      cassandraConnector.executeQuery(tagsQuery, tagsParams)
      .then(rows => {
        const eventIds = makeSet(rows, row => row.eventid);

        const eventsQuery = `
        SELECT *
        FROM events
        WHERE pipelinekey = ?
        AND eventid IN ?
        AND fulltext LIKE ?
        `.trim();

        const eventsParams = [
          toPipelineKey(args.sourceFilter),
          eventIds,
          `%${args.fulltextTerm}%`
        ];

        return cassandraConnector.executeQuery(eventsQuery, eventsParams);
      })
      .then(rows => {
        resolve({
          features: rows.map(eventToFeature)
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

/**
 * @param {site: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byEdges(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.filteredEdges || !args.filteredEdges.length) return reject('No edges by which to filter specified');

    const tagsQuery = `
    SELECT eventid, topic
    FROM eventtags
    WHERE topic IN ?
    AND pipelinekey = ?
    AND event_time = ?
    AND placecentroidcoordx = ?
    AND placecentroidcoordy = ?
    `.trim();

    const tagsParams = [
      args.filteredEdges,
      toPipelineKey(args.sourceFilter),
      '', // FIXME event_time not available
      '', // FIXME placecentroidcoordx not available
      '' // FIXME placecentroidcoordy not available
    ];

    cassandraConnector.executeQuery(tagsQuery, tagsParams)
    .then(rows => {
      const eventIds = makeMultiMap(rows, row => row.eventid, row => row.topic);

      const eventQuery = `
      SELECT *
      FROM events
      WHERE pipelinekey = ?
      AND eventid IN ?
      `.trim();

      const eventParams = [
        toPipelineKey(args.sourceFilter),
        eventIds
      ];

      return cassandraConnector.executeQuery(eventQuery, eventParams);
    })
    .then(rows => {
      resolve({
        features: rows.map(eventToFeature)
      });
    })
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
    FROM events
    WHERE eventid = ?
    AND pipelinekey = 'all'
    `.trim();

    const eventParams = [
      args.messageId
    ];

    cassandraConnector.executeQuery(eventQuery, eventParams)
    .then(eventRows => {
      if (eventRows.length > 1) return reject(`Got more ${eventRows.length} events with id ${args.messageId}`);
      const event = eventRows[0];

      const tagsQuery = `
      SELECT topic
      FROM eventtags
      WHERE pipelinekey = 'all'
      AND topic = ?
      AND pipelinekey = ?
      AND event_time = ?
      AND placecentroidcoordx = ?
      AND placecentroidcoordy = ?
      AND eventid = ?
      `.trim();

      const tagsParams = [
        '', // FIXME topic not available
        event.pipelinekey,
        event.event_time,
        '', // FIXME placecentroidcoordx not available
        '', // FIXME placecentroidcoordy not available
        event.event_id
      ];

      cassandraConnector.executeQuery(tagsQuery, tagsParams)
      .then(tagsRows => {
        const feature = eventToFeature(event);
        feature.properties.edges = makeSet(tagsRows, row => row.topic);
        resolve(feature);
      })
      .catch(reject);
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
      .then(result => resolve({ translatedSentence: result.translatedSentence, originalSentence: args.sentence }))
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
      .then(result => resolve({ words: result.translatedSentence }))
      .catch(reject);
  });
}

module.exports = {
  byLocation: trackEvent(withRunTime(byLocation), 'messagesForLocation'),
  byBbox: trackEvent(withRunTime(byBbox), 'messagesForBbox'),
  byEdges: trackEvent(withRunTime(byEdges), 'messagesForEdges'),
  event: trackEvent(event, 'messageForEven'),
  translate: trackEvent(translate, 'translate'),
  translateWords: trackEvent(translateWords, 'translateWords')
};
