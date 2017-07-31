'use strict';

const Promise = require('promise');
const geotile = require('geotile');

function withRunTime(promiseFunc) {
  function runTimer() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      promiseFunc.apply(this, arguments)
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

const allSources = [
  'bing',
  'customevents',
  'tadaweb',
  'facebook',
  'twitter',
  'radio',
  'reddit',
  'instagram'
];

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
    return [mainEdge, null, null];
  }

  const extraFilters = filteredEdges.slice(0, 2);
  if (filteredEdges.length > 2) {
    console.warn(`Only two filtered edges supported, ignoring: ${filteredEdges.slice(2).join(', ')}`);
  }

  const selectedFilters = [mainEdge].concat(extraFilters).sort();
  while (selectedFilters.length < 3) {
    selectedFilters.push(null);
  }

  return selectedFilters;
}

function tilesForBbox(bbox, zoomLevel) {
  const fence = {north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3]};
  return geotile.tileIdsForBoundingBox(fence, zoomLevel).map(geotile.decodeTileId);
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

module.exports = {
  parseFromToDate,
  parseTimespan,
  toPipelineKey,
  toConjunctionTopics,
  tilesForBbox,
  allSources: allSources,
  withRunTime: withRunTime
};
