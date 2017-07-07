'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const withRunTime = require('../shared').withRunTime;
const makeMap = require('../../utils/collections').makeMap;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

function cassandraRowToFeature(row) {
  return {
    type: row.pipeline,
    coordinates: [],
    properties: {
      edges: row.detectedkeywords,
      messageid: row.externalid,
      createdtime: row.event_time,
      sentiment: row.computedfeatures && row.computedfeatures.sentiment &&
        row.computedfeatures.sentiment.pos_avg > row.computedfeatures.sentiment.neg_avg
        ? row.computedfeatures.sentiment.pos_avg - row.computedfeatures.sentiment.neg_avg + 0.6
        : row.computedfeatures.sentiment.neg_avg - row.computedfeatures.sentence.pos_avg,
      title: row.title,
      originalSources: row.pipeline &&
        [row.pipeline],
      language: row.eventlangcode,
      source: row.sourceurl,
      fullText: row.messagebody
    }
  };
}

function makeDefaultClauses(args) {
  let params = [];
  const clauses = [];

  if (args.mainTerm) {
    clauses.push('(detectedkeywords CONTAINS ?)');
    params.push(args.mainTerm);
  }

  if (args.filteredEdges) {
    clauses.push(`(${args.filteredEdges.map(_ => '(detectedkeywords CONTAINS ?)').join(' OR ')})`); // eslint-disable-line no-unused-vars
    params = params.concat(args.filteredEdges);
  }

  if (args.fromDate) {
    clauses.push('(event_time >= ?)');
    params.push(args.fromDate);
  }

  if (args.toDate) {
    clauses.push('(event_time <= ?)');
    params.push(args.toDate);
  }

  if (args.langCode) {
    clauses.push('(eventlangcode = ?)');
    params.push(args.langCode);
  }

  if (args.originalSource) {
    clauses.push('(sourceid = ?)');
    params.push(args.originalSource);
  }

  clauses.push('(pipeline IN (\'Twitter\', \'Facebook\', \'Instagram\', \'Radio\', \'Reddit\'))');

  return {clauses: clauses, params: params};
}

function makePlacesQuery(args, placeIds) {
  const defaults = makeDefaultClauses(args);
  const clauses = defaults.clauses;
  let params = defaults.params;

  clauses.push(`(${placeIds.map(_ => '(detectedplaceids CONTAINS ?)').join(' OR ')})`); // eslint-disable-line no-unused-vars
  params = params.concat(placeIds);

  const query = `SELECT * FROM fortis.events WHERE ${clauses.join(' AND ')}`;
  return {query: query, params: params};
}

/**
 * @param {site: string, originalSource: string, coordinates: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byLocation(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.coordinates || args.coordinates.length !== 2) return reject('No valid coordinates specified to fetch');

    featureServiceClient.fetchByPoint({latitude: args.coordinates[0], longitude: args.coordinates[1]})
    .then(places => {
      const idToBbox = makeMap(places, place => place.id, place => place.bbox);
      const query = makePlacesQuery(args, Object.keys(idToBbox));
      cassandraConnector.executeQuery(query.query, query.params)
      .then(rows => {
        const features = rows.map(row => {
          const feature = cassandraRowToFeature(row);
          feature.coordinates = row.detectedplaceids.map(placeId => idToBbox[placeId]).filter(bbox => bbox != null);
          return feature;
        });

        resolve({
          features: features
        });
      })
      .catch(reject);
    })
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

    featureServiceClient.fetchByBbox({north: args.bbox[0], west: args.bbox[1], south: args.bbox[2], east: args.bbox[3]})
    .then(places => {
      const idToBbox = makeMap(places, place => place.id, place => place.bbox);
      const query = makePlacesQuery(args, Object.keys(idToBbox));
      cassandraConnector.executeQuery(query.query, query.params)
      .then(rows => {
        const features = rows.map(row => {
          const feature = cassandraRowToFeature(row);
          feature.coordinates = row.detectedplaceids.map(placeId => idToBbox[placeId]).filter(bbox => bbox != null);
          return feature;
        });

        resolve({
          features: features
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

function makeEdgesQuery(args) {
  const defaults = makeDefaultClauses(args);
  const clauses = defaults.clauses;
  const params = defaults.params;

  const query = `SELECT * FROM fortis.events WHERE ${clauses.join(' AND ')}`;
  return {query: query, params: params};
}

/**
 * @param {site: string, originalSource: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byEdges(args, res) { // eslint-disable-line no-unused-vars
  const query = makeEdgesQuery(args);
  return new Promise((resolve, reject) => {
    cassandraConnector.executeQuery(query.query, query.params)
    .then(rows => {
      const placeIds = new Set();
      rows.forEach(row => row.detectedplaceids.forEach(placeId => placeIds.add(placeId)));
      featureServiceClient.fetchById(placeIds)
      .then(places => {
        const idToBbox = makeMap(places, place => place.id, place => place.bbox);
        const features = rows.map(row => {
          const feature = cassandraRowToFeature(row);
          feature.coordinates = row.detectedplaceids.map(placeId => idToBbox[placeId]).filter(bbox => bbox != null);
          return feature;
        });

        resolve({
          features: features
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

function makeEventQuery(args) {
  const query = 'SELECT * FROM fortis.events WHERE id = ?';
  const params = [args.messageId];
  return {query: query, params: params};
}

/**
 * @param {{site: string, messageId: string, dataSources: string[], langCode: string}} args
 * @returns {Promise.<Feature>}
 */
function event(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.messageId) return reject('No event id to fetch specified');

    const query = makeEventQuery(args);
    cassandraConnector.executeQuery(query.query, query.params)
    .then(rows => {
      if (rows.length > 1) return reject(`Got more ${rows.length} events with id ${args.messageId}`);

      const row = rows[0];
      const feature = cassandraRowToFeature(row);
      featureServiceClient.fetchById(row.detectedplaceids || [])
      .then(places => {
        feature.coordinates = places.map(place => place.bbox);

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
