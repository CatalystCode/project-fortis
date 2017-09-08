'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const isObject = require('lodash/isObject');

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

module.exports = {
  parseLimit,
  parseFromToDate,
  toPipelineKey,
  toConjunctionTopics,
  tilesForBbox,
  tilesForLocations,
  limitForInClause,
  fromTopicListToConjunctionTopics,
  withRunTime: withRunTime
};