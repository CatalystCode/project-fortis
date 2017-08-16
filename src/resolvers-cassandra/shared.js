'use strict';

const Promise = require('promise');
const geotile = require('geotile');

function withRunTime(promiseFunc) {
  function runTimer(...args) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      promiseFunc(...args)
      .then(returnValue => {
        const endTime = Date.now();
        returnValue.runTime = endTime - startTime;
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

function toConjunctionTopics(mainEdge, filteredEdges) {
  if (!filteredEdges || !filteredEdges.length) {
    return [mainEdge, '', ''];
  }

  const extraFilters = filteredEdges.slice(0, 2);
  if (filteredEdges.length > 2) {
    console.warn(`Only two filtered edges supported, ignoring: ${filteredEdges.slice(2).join(', ')}`);
  }

  const selectedFilters = [mainEdge].concat(extraFilters).sort();
  while (selectedFilters.length < 3) {
    selectedFilters.push('');
  }

  return selectedFilters;
}

function tilesForBbox(bbox, zoomLevel) {
  const fence = {north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]};
  return geotile.tileIdsForBoundingBox(fence, zoomLevel).map(geotile.decodeTileId);
}

function tilesForLocations(locations, zoomLevel) {
  return locations.map(([lat, lon]) => geotile.tileIdFromLatLong(lat, lon, zoomLevel)).map(geotile.decodeTileId);
}

function parseTimespan(timespan) {
  // TODO: implement
  return {
    period: timespan,
    periodType: ''
  };
}

function parseFromToDate(fromDate, toDate) {
  // TODO: implement
  return {
    period: '',
    periodType: '',
    fromDate,
    toDate
  };
}

function parseLimit(limit) {
  return limit > 0 ? limit : 15;
}

module.exports = {
  parseLimit,
  parseFromToDate,
  parseTimespan,
  toPipelineKey,
  toConjunctionTopics,
  tilesForBbox,
  tilesForLocations,
  limitForInClause,
  withRunTime: withRunTime
};
