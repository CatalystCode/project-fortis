'use strict';

const Promise = require('promise');
const moment = require('moment');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const { getSiteDefinition, parseLimit, withRunTime, tilesForBbox, toPipelineKey, fromTopicListToConjunctionTopics, toConjunctionTopics, limitForInClause } = require('../shared');
const { makeSet } = require('../../utils/collections');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { requiresRole } = require('../../auth');

function eventToFeature(row) {
  const FeatureType = 'MultiPoint';

  let computedfeatures;
  try {
    computedfeatures = row.computedfeatures_json ? JSON.parse(row.computedfeatures_json) : {};
  } catch (err) {
    console.error(`Unable to parse computedfeatures '${row.computedfeatures_json}' on event ${row.eventid}`);
    computedfeatures = {};
  }

  const places = computedfeatures.places != null && computedfeatures.places.length > 0
    ? computedfeatures.places
    : [];

  const entities = computedfeatures.entities != null && computedfeatures.entities.length > 0
    ? computedfeatures.entities
    : [];

  const sentiment = computedfeatures.sentiment != null && computedfeatures.sentiment.neg_avg != null
    ? computedfeatures.sentiment.neg_avg
    : -1;

  const keywords = computedfeatures.keywords != null && computedfeatures.keywords.length > 0
    ? computedfeatures.keywords
    : [];

  return {
    type: FeatureType,
    coordinates: places.map(place => [place.centroidlon, place.centroidlat]),
    properties: {
      edges: keywords,
      messageid: row.eventid,
      sourceeventid: row.sourceeventid,
      places: places.map(place => place.placeid),
      entities: entities.map(entity => entity.name),
      eventtime: row.eventtime.getTime(),
      sentiment: sentiment,
      title: row.title,
      summary: row.summary || row.title,
      externalsourceid: row.externalsourceid,
      language: row.eventlangcode,
      pipelinekey: row.pipelinekey,
      link: row.sourceurl,
      body: row.body
    }
  };
}

function fetchPlacesById(feature) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    let { properties } = feature;
    const { places } = properties;

    featureServiceClient.fetchById(places, 'bbox,centroid')
      .then(places => {
        properties.places = Array.from(new Set(places.map(place=>place.name.toLowerCase())));
        resolve(Object.assign({}, feature, { properties }));
      })
      .catch(reject);
  });
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

    if (eventIdResponse.rows.length) {
      cassandraConnector.executeQuery(eventsQuery, eventsParams)
        .then(rows => {
          const sortedEvents = rows.sort((a, b)=>moment.utc(b.eventtime.getTime()).diff(moment.utc(a.eventtime.getTime())));

          resolve({
            type: 'FeatureCollection',
            features: sortedEvents.map(eventToFeature),
            bbox: args.bbox,
            pageState: eventIdResponse.pageState
          });
        })
        .catch(reject);
    } else {
      resolve({ type: 'FeatureCollection', features: [] });
    }
  });
}

function byBbox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.bbox || args.bbox.length !== 4) return reject('Invalid bbox specified');
    if (!args.conjunctivetopics.length) return reject('Empty conjunctive topic list specified');

    const tiles = tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id);
    if (!tiles || !tiles.length) {
      return reject(`No tiles found for bounding box ${args.bbox.join(',')} and zoom ${args.zoomLevel}`);
    }

    let tableName = 'eventplaces';
    let tagsParams = [
      ...fromTopicListToConjunctionTopics(args.conjunctivetopics),
      args.fromDate,
      args.toDate,
      tiles,
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
    AND eventtime >= ?
    AND eventtime <= ?
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

function byEdges(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.filteredEdges || !args.filteredEdges.length) return reject('No edges by which to filter specified');

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
      args.toDate,
      args.fromDate,
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

function byPipeline(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.pipelinekeys || !args.pipelinekeys.length) return reject('No pipelines by which to filter specified');
    if (!args || !args.mainTerm) return reject('No term to query specified');
    if (!args || !args.toDate || !args.fromDate) return reject('No date range to query specified');

    const pipelineQuery = `
    SELECT eventid
    FROM fortis.eventsbypipeline
    WHERE pipelinekey IN ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ''
    AND conjunctiontopic3 = ''
    AND tilez = 15
    AND eventtime <= ?
    AND eventtime >= ?
    `.trim();

    const pipelineParams = [
      limitForInClause(args.pipelinekeys),
      args.mainTerm,
      args.toDate,
      args.fromDate
    ];

    cassandraConnector.executeQueryWithPageState(pipelineQuery, pipelineParams, args.pageState, parseLimit(args.limit))
      .then(response => queryEventsTable(response, args))
      .then(resolve)
      .catch(reject);
  });
}

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

        return eventToFeature(rows[0]);
      })
      .then(fetchPlacesById)
      .then(resolve)
      .catch(reject);
  });
}

function translate(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    getSiteDefinition()
      .then(sitesettings => {
        return translatorService.translate(sitesettings.site.properties.translationSvcToken,
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

function translateWords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    getSiteDefinition()
      .then(sitesettings => {
        return translatorService.translateSentenceArray(
          sitesettings.site.properties.translationSvcToken,
          args.words,
          args.fromLanguage,
          args.toLanguage
        );
      }).then(result => {
        const words = result.translatedSentence;

        resolve({
          words
        });
      })
      .catch(reject);
  });
}

module.exports = {
  byBbox: requiresRole(trackEvent(withRunTime(byBbox), 'messagesForBbox'), 'user'),
  byEdges: requiresRole(trackEvent(withRunTime(byEdges), 'messagesForEdges'), 'user'),
  byPipeline: requiresRole(trackEvent(withRunTime(byPipeline), 'messagesForPipeline'), 'user'),
  event: requiresRole(trackEvent(event, 'messageForEvent'), 'user'),
  translate: requiresRole(trackEvent(translate, 'translate'), 'user'),
  translateWords: requiresRole(trackEvent(translateWords, 'translateWords'), 'user')
};