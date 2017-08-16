'use strict';

const Promise = require('promise');
const request = require('request');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const apiUrlBase = process.env.FORTIS_FEATURE_SERVICE_HOST;

function formatIdsUri(ids, include) {
  let uri = `${apiUrlBase}/features/id/${ids.map(encodeURIComponent).join(',')}`;
  if (include) uri += `?include=${include}`;
  return uri;
}

function formatBboxUri(north, west, south, east, include) {
  let uri = `${apiUrlBase}/features/bbox/${north}/${west}/${south}/${east}`;
  if (include) uri += `?include=${include}`;
  return uri;
}

function formatPointUri(latitude, longitude, include) {
  let uri = `${apiUrlBase}/features/point/${latitude}/${longitude}`;
  if (include) uri += `?include=${include}`;
  return uri;
}

function formatNameUri(names, include) {
  let uri = `${apiUrlBase}/features/name/${names.map(encodeURIComponent).join(',')}`;
  if (include) uri += `?include=${include}`;
  return uri;
}

function callFeatureService(uri) {
  return new Promise((resolve, reject) => {
    request.get(uri, (err, response, body) => {
      if (err || response.statusCode !== 200) {
        return reject(`Unable to call feature service: ${err}`);
      }

      let featuresCollection;
      try {
        featuresCollection = JSON.parse(body);
      } catch (err) {
        return reject(`Unable to parse JSON for feature service response ${body}: ${err}`);
      }

      const features = featuresCollection && featuresCollection.features;
      if (!features) {
        return reject(`Unable to look up features in feature service response: ${body}`);
      }

      resolve(features);
    });
  });
}

/**
 * @param {{north: number, west: number, south: number, east: number}} fence 
 * @param {string} include
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByBbox(fence, include) {
  return callFeatureService(formatBboxUri(fence.north, fence.west, fence.south, fence.east, include));
}

/**
 * @param {{latitude: number, longitude: number}} point 
 * @param {string} include
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByPoint(point, include) {
  return callFeatureService(formatPointUri(point.latitude, point.longitude, include));
}

/**
 * @param {string|string[]} name
 * @param {string} include
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByName(name, include) {
  const names = name.constructor === Array ? name : [name];
  return callFeatureService(formatNameUri(names, include));
}

/**
 * @param {string|string[]} id
 * @param {string} include
 * @returns {Promise.<Array<{id: string, name: string, layer: string, bbox: number[]}>>}
 */
function fetchById(id, include) {
  const ids = id.constructor === Array ? id : [id];
  return callFeatureService(formatIdsUri(ids, include));
}

module.exports = {
  fetchById: trackDependency(fetchById, 'FeatureService', 'fetchById'),
  fetchByBbox: trackDependency(fetchByBbox, 'FeatureService', 'fetchByBbox'),
  fetchByPoint: trackDependency(fetchByPoint, 'FeatureService', 'fetchByPoint'),
  fetchByName: trackDependency(fetchByName, 'FeatureService', 'fetchByName')
};