'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const { parseFromToDate, getsiteDefintion, parseLimit, withRunTime, tilesForBbox, toPipelineKey, fromTopicListToConjunctionTopics, toConjunctionTopics, limitForInClause } = require('../shared');
const { makeSet } = require('../../utils/collections');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

function eventToFeature(row) {
  const FeatureType = 'MultiPoint';

  return {
    type: FeatureType,
    coordinates: row.computedfeatures.places.map(place => [place.centroidlon, place.centroidlat]),
    properties: {
      edges: row.topics,
      messageid: row.eventid,
      sourceeventid: row.sourceeventid,
      entities: row.computedfeatures && row.computedfeatures.entities ? row.computedfeatures.entities.map(entity => entity.name) : [],
      eventtime: row.eventtime,
      sentiment: row.computedfeatures && row.computedfeatures.sentiment ? row.computedfeatures.sentiment.neg_avg : -1,
      title: row.title,
      fullText: row.body,
      summary: row.summary,
      externalsourceid: row.externalsourceid,
      language: row.eventlangcode,
      pipelinekey: row.pipelinekey,
      link: row.sourceurl,
      body: row.body
    }
  };
}

function queryEventsTable(eventIdResponse, args) {
  return new Promise((resolve, reject) => {
    const eventIds = makeSet(eventIdResponse.rows, row => row.eventid);
    let eventsQuery = `
    SELECT *
    FROM fortis.events
    WHERE eventid IN ?
    `.trim();

    let eventsParams = [
      limitForInClause(eventIds)
    ];

    if (args.fulltextTerm) {
      eventsQuery += ' AND fulltext LIKE ?';
      eventsParams.push(`%${args.fulltextTerm}%`);
    }

    if (eventIdResponse.rows.length) {
      cassandraConnector.executeQuery(eventsQuery, eventsParams)
        .then(rows => {
          resolve({
            type: 'FeatureCollection',
            features: rows.map(eventToFeature),
            pageState: eventIdResponse.pageState,
            bbox: args.bbox
          });
        })
        .catch(reject);
    } else {
      resolve({ type: 'FeatureCollection', features: [] });
    }
  });
}

/**
 * @param {externalsourceid: string, bbox: number[], conjunctivetopics: string[], limit: number, pageState: number, fromDate: string, toDate: string, pipelinekeys: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 **/
function byBbox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.bbox || args.bbox.length !== 4) return reject('Invalid bbox specified');
    if (!args.conjunctivetopics.length) return reject('Empty conjunctive topic list specified');

    let tableName = 'eventplaces';
    let tagsParams = [
      ...fromTopicListToConjunctionTopics(args.conjunctivetopics),
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id),
      args.zoomLevel,
      args.pipelinekeys
    ];

    if (args.externalsourceid) {
      tagsParams.push(args.externalsourceid);
      tableName = 'eventplacesbysource';
    }

    const tagsQuery = `
    SELECT eventid
    FROM fortis.${tableName}
    WHERE conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND eventtime >= '${args.fromDate}' 
    AND eventtime <= '${args.toDate}'
    AND tileid IN ?
    AND tilez = ?
    AND pipelinekey IN ?
    ${args.externalsourceid ? ' AND externalsourceid = ?' : ''}
    `.trim();

    cassandraConnector.executeQueryWithPageState(tagsQuery, tagsParams, args.pageState, parseLimit(args.limit))
      .then(response => queryEventsTable(response, args))
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
    getsiteDefintion()
      .then(sitesettings => {
        return translatorService.translate(sitesettings.site.properties.translationsvctoken,
          args.sentence,
          args.fromLanguage,
          args.toLanguage);
      })
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
  byBbox: trackEvent(withRunTime(byBbox), 'messagesForBbox'),
  byEdges: trackEvent(withRunTime(byEdges), 'messagesForEdges'),
  event: trackEvent(event, 'messageForEvent'),
  translate: trackEvent(translate, 'translate'),
  translateWords: trackEvent(translateWords, 'translateWords')
};