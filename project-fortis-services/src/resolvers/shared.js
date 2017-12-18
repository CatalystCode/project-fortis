'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const isObject = require('lodash/isObject');
const json2csv = require('json2csv');
const NodeCache = require('node-cache');
const uuidv4 = require('uuid/v4');
const { createFile } = require('../clients/storage/BlobStorageClient');
const cassandraConnector = require('../clients/cassandra/CassandraConnector');

const BlacklistPlaces = ['colombia'];

const MINUTES = 60;
const termsCache = new NodeCache( { stdTTL: 20 * MINUTES } );

function termsFilter(term, categoryFilter) {
  if (categoryFilter) {
    return term.category && term.category === categoryFilter;
  }

  return true;
}

//todo: a temporary hack until we have the formal place blacklist filter in place
function BlacklistPlaceList(){
  return BlacklistPlaces;
}

function getTermsFromCache() {
  return termsCache.get('terms');
}

function setTermsCache(terms) {
  termsCache.set('terms', terms);
}

function getTermsByCategory(translationLanguage, category, ignoreCache) {
  let watchlistTerms = getTermsFromCache();

  return new Promise((resolve, reject) => {
    if (watchlistTerms && !ignoreCache) {
      return resolve({
        edges: watchlistTerms.filter(term => termsFilter(term, category))
      });
    }

    getSiteTerms(translationLanguage, category)
      .then(watchlistTermsRsp => {
        resolve({
          edges: watchlistTermsRsp.edges.filter(term => termsFilter(term, category))
        });
      }).catch(reject);
  });
}

function cassandraRowToSite(row) {
  // Please note that the following properties in the SiteProperties are NOT in Cassandra's sitessetings:
  // storageConnectionString, featuresConnectionString, mapzenApiKey, fbToken.
  return {
    name: row.sitename,
    properties: {
      targetBbox: row.geofence,
      defaultZoomLevel: row.defaultzoom,
      logo: row.logo,
      title: row.title,
      translationSvcToken: row.translationsvctoken,
      featureservicenamespace: row.featureservicenamespace,
      defaultLocation: row.geofence,
      defaultLanguage: row.defaultlanguage,
      supportedLanguages: row.languages,
      cogSpeechSvcToken: row.cogspeechsvctoken,
      cogVisionSvcToken: row.cogvisionsvctoken,
      cogTextSvcToken: row.cogtextsvctoken
    }
  };
}

function transformWatchlist(item, translatedlanguage) {
  return {
    topicid: item.topicid,
    name: item.topic,
    category: item.category,
    translatedname: item.lang_code !== (translatedlanguage || item.lang_code) ?
      (item.translations || {})[translatedlanguage] || item.topic : item.topic,
    translatednamelang: translatedlanguage,
    namelang: item.lang_code
  };
}

function getSiteDefinition() {
  return new Promise((resolve, reject) => {
    cassandraConnector.executeQuery('SELECT * FROM fortis.sitesettings', [])
      .then(rows => {
        if (rows.length < 1) return reject('Could not find site with sitename');
        if (rows.length > 1) return reject(`Got more than one site (got ${rows.length}) with sitename`);

        resolve({ site: cassandraRowToSite(rows[0]) });
      })
      .catch(reject);
  });
}

function getSiteTerms(translationLanguage, category) {
  return new Promise((resolve, reject) => {
    const termsQuery = 'SELECT topicid, topic, translations, lang_code, category FROM fortis.watchlist';
    cassandraConnector.executeQuery(termsQuery, [])
      .then(rows => {
        const watchlistTerms = rows.map(item => transformWatchlist(item, translationLanguage));
        setTermsCache(watchlistTerms);

        resolve({
          edges: watchlistTerms.filter(term => termsFilter(term, category))
        });
      }).catch(reject);
  });
}

function withRunTime(promiseFunc) {
  function runTimer(...args) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      promiseFunc(...args)
        .then(returnValue => {
          const endTime = Date.now();
          if (isObject(returnValue)) {
            returnValue.runTime = endTime - startTime;
          }
          resolve(returnValue);
        })
        .catch(reject);
    });
  }

  return runTimer;
}

const MAX_IN_CLAUSES = 65535;

function limitForInClause(collection) {
  const list = collection.constructor === Array ? collection : Array.from(collection);
  if (list.length <= MAX_IN_CLAUSES) {
    return list;
  }

  console.warn(`Only ${MAX_IN_CLAUSES} items allowed for IN clause, ignoring ${list.length - MAX_IN_CLAUSES} elements`);
  return list.slice(0, MAX_IN_CLAUSES);
}

function toPipelineKey(sourceFilter) {
  if (!sourceFilter || !sourceFilter.length) {
    return 'all';
  }

  if (sourceFilter.length > 1) {
    console.warn(`Only one source filter supported, ignoring: ${sourceFilter.slice(1).join(', ')}`);
  }

  return sourceFilter[0];
}

function fromTopicListToConjunctionTopics(topicTerms, conjunctiveTopicLimit = 3) {
  let selectedFilters = topicTerms
    .filter(edge => !!edge)
    .slice(0, conjunctiveTopicLimit)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  if (topicTerms.length > conjunctiveTopicLimit) {
    console.warn(`Only ${conjunctiveTopicLimit} terms supported, ignoring: ${topicTerms.slice(conjunctiveTopicLimit).join(', ')}`);
  }

  while (selectedFilters.length < conjunctiveTopicLimit) {
    selectedFilters.push('');
  }

  return selectedFilters;
}

function toConjunctionTopics(mainEdge, filteredEdges) {
  if (!mainEdge) {
    console.warn('mainEdge not set');
    mainEdge = '';
  }

  if (!filteredEdges || !filteredEdges.length) {
    return [mainEdge, '', ''];
  }

  return fromTopicListToConjunctionTopics([mainEdge].concat(filteredEdges));
}

function tilesForBbox(bbox, zoomLevel) {
  const fence = { north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3] };
  return geotile.tileIdsForBoundingBox(fence, zoomLevel).map(geotile.decodeTileId);
}

function tilesForLocations(locations, zoomLevel) {
  return locations.map(([lat, lon]) => geotile.tileIdFromLatLong(lat, lon, zoomLevel)).map(geotile.decodeTileId);
}

function parseLimit(limit) {
  const DEFAULT_LIMIT = 15;

  return limit > 0 ? limit : DEFAULT_LIMIT;
}

function withCsvExporter(promiseFunc, exportPropertyName, container, expiryMinutes) {
  container = container || 'csv-export';
  expiryMinutes = expiryMinutes || (2 * MINUTES);

  function formatCsvFilename(provenance) {
    const uniqueIdentifier = uuidv4();
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${now.getUTCMonth() + 1}/${now.getUTCDate()}/${now.getUTCHours()}/${now.getUTCMinutes()}/${uniqueIdentifier}`;
    return `${folder}/${provenance}.csv`;
  }

  function csvExporter(...args) {
    const reportName = promiseFunc.name;

    if (!args || !args.length || !args[0] || !args[0].csv) {
      console.log(`No CSV requested for ${reportName}, skipping creation of report`);
      return promiseFunc(...args);
    }

    return new Promise((resolve, reject) => {
      console.log(`CSV requested, creating report for ${reportName} based on ${exportPropertyName}`);
      promiseFunc(...args)
        .then(returnValue => {
          const csvItems = returnValue && returnValue[exportPropertyName];
          const csvText = csvItems && csvItems.length ? json2csv({ data: csvItems, withBOM: true }) : '';
          createFile(container, formatCsvFilename(reportName), csvText, expiryMinutes)
            .then(csv => {
              returnValue.csv = csv;
              resolve(returnValue);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  return csvExporter;
}

module.exports = {
  parseLimit,
  toPipelineKey,
  toConjunctionTopics,
  tilesForBbox,
  tilesForLocations,
  termsFilter,
  getSiteTerms,
  limitForInClause,
  getTermsFromCache,
  getTermsByCategory,
  setTermsCache,
  BlacklistPlaceList,
  transformWatchlist,
  getSiteDefinition,
  fromTopicListToConjunctionTopics,
  withCsvExporter,
  withRunTime
};