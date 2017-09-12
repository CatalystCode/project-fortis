'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const isObject = require('lodash/isObject');
const json2csv = require('json2csv');
const uuidv4 = require('uuid/v4');
const { createFile } = require('../clients/storage/BlobStorageClient');
const cassandraConnector = require('../clients/cassandra/CassandraConnector');

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
      translationsvctoken: row.translationsvctoken,
      featureServiceNamespace: row.featureservicenamespace,
      defaultLocation: row.geofence,
      defaultLanguage: row.defaultlanguage,
      supportedLanguages: row.languages
    }
  };
}

function getSiteDefintion(){
  return new Promise((resolve, reject) => {    
    const siteByIdQuery = 'SELECT * FROM fortis.sitesettings';
    cassandraConnector.executeQuery(siteByIdQuery, [])
    .then(rows => {
      if (rows.length < 1) return reject('Could not find site with sitename');
      if (rows.length > 1) return reject(`Got more than one site (got ${rows.length}) with sitename`);

      resolve({site: cassandraRowToSite(rows[0])});
    })
    .catch(reject);
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
  let selectedFilters = topicTerms.filter(edge => !!edge).slice(0, conjunctiveTopicLimit).sort();

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
  const fence = {north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]};
  return geotile.tileIdsForBoundingBox(fence, zoomLevel).map(geotile.decodeTileId);
}

function tilesForLocations(locations, zoomLevel) {
  return locations.map(([lat, lon]) => geotile.tileIdFromLatLong(lat, lon, zoomLevel)).map(geotile.decodeTileId);
}

function parseFromToDate(fromDate, toDate) { // eslint-disable-line no-unused-vars
  // TODO: implement
  return {
    fromDate: '2017-08-11 15:00:00.000000+0000',
    toDate: '2017-08-11 16:00:00.000000+0000',
    period: 'hour-2017-08-11 15',
    periodType: 'hour'
  };
}

function parseLimit(limit) {
  const DEFAULT_LIMIT = 15;

  return limit > 0 ? limit : DEFAULT_LIMIT;
}

const DEFAULT_CSV_CONTAINER = 'csv-export';
const DEFAULT_CSV_EXPIRY_MINUTES = 2 * 60;

function asCsvExporter(promiseFunc, exportPropertyName, container, expiryMinutes) {
  container = container || DEFAULT_CSV_CONTAINER;
  expiryMinutes = expiryMinutes || DEFAULT_CSV_EXPIRY_MINUTES;

  function formatCsvFilename(provenance) {
    const uniqueIdentifier = uuidv4();
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${now.getUTCMonth()+1}/${now.getUTCDate()}/${now.getUTCHours()}/${now.getUTCMinutes()}/${uniqueIdentifier}`;
    return `${folder}/${provenance}.csv`;
  }

  function csvExporter(...args) {
    return new Promise((resolve, reject) => {
      promiseFunc(...args)
      .then(returnValue => {
        const csvItems = returnValue && returnValue[exportPropertyName];
        const csvText = csvItems && csvItems.length ? json2csv({ data: csvItems, withBOM: true }) : '';
        return createFile(container, formatCsvFilename(promiseFunc.name), csvText, expiryMinutes);
      })
      .then(resolve)
      .catch(reject);
    });
  }

  return csvExporter;
}

module.exports = {
  parseLimit,
  parseFromToDate,
  toPipelineKey,
  toConjunctionTopics,
  tilesForBbox,
  tilesForLocations,
  limitForInClause,
  getSiteDefintion,
  fromTopicListToConjunctionTopics,
  asCsvExporter,
  withRunTime
};