'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

/**
 * @param {site: string, originalSource: string, coordinates: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byLocation(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {site: string, originalSource: string, bbox: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byBbox(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {site: string, originalSource: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byEdges(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{site: string, messageId: string, dataSources: string[], langCode: string}} args
 * @returns {Promise.<Feature>}
 */
function event(args, res) { // eslint-disable-line no-unused-vars
  const eventById = 'SELECT * FROM fortis.events WHERE id = ?';

  return new Promise((resolve, reject) => {
    const eventId = args && args.messageId;
    if (!eventId) {
      return reject('No event id to fetch specified');
    }

    cassandraConnector.executeQuery(eventById, [eventId])
    .then(rows => {
      if (rows.length > 1) {
        return reject(`Got more ${rows.length} events with id ${eventId}`);
      }

      const ev = rows[0];
      featureServiceClient.fetchById(ev.detectedplaceids || [])
      .then(features => {
        resolve({
          type: ev.pipeline,
          coordinates: features.map(feature => feature.bbox),
          properties: {
            edges: ev.detectedkeywords,
            messageid: ev.externalid,
            createdtime: ev.event_time,
            sentiment: ev.computedfeatures && ev.computedfeatures.sentiment &&
              ev.computedfeatures.sentiment.pos_avg > ev.computedfeatures.sentiment.neg_avg
              ? ev.computedfeatures.sentiment.pos_avg - ev.computedfeatures.sentiment.neg_avg + 0.6
              : ev.computedfeatures.sentiment.neg_avg - ev.computedfeatures.sentence.pos_avg,
            title: ev.title,
            originalSources: ev.pipeline &&
              [ev.pipeline],
            language: ev.eventlangcode,
            source: ev.sourceurl,
            fullText: ev.messagebody
          }
        });
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
  byLocation: byLocation,
  byBbox: byBbox,
  byEdges: byEdges,
  event: event,
  translate: translate,
  translateWords: translateWords
};
