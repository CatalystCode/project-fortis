'use strict';

const Promise = require('promise');
const request = require('request');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const {
  fortisFeatureServiceHost
} = require('../../../config').featureService;

function formatIdsUri(ids, extraFields) {
  let uri = `${fortisFeatureServiceHost}/features/id/${ids.map(encodeURIComponent).join(',')}`;
  if (extraFields) uri += `?include=${extraFields}`;
  return uri;
}

function formatBboxUri(north, west, south, east, extraFields) {
  let uri = `${fortisFeatureServiceHost}/features/bbox/${north}/${west}/${south}/${east}`;
  if (extraFields) uri += `?include=${extraFields}`;
  return uri;
}

function formatPointUri(latitude, longitude, extraFields) {
  let uri = `${fortisFeatureServiceHost}/features/point/${latitude}/${longitude}`;
  if (extraFields) uri += `?include=${extraFields}`;
  return uri;
}

function formatNameUri(names, extraFields) {
  let uri = `${fortisFeatureServiceHost}/features/name/${names.map(encodeURIComponent).join(',')}`;
  if (extraFields) uri += `?include=${extraFields}`;
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
 * @param {string} extraFields
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByBbox(fence, extraFields) {
  return callFeatureService(formatBboxUri(fence.north, fence.west, fence.south, fence.east, extraFields));
}

/**
 * @param {{latitude: number, longitude: number}} point
 * @param {string} extraFields
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByPoint(point, extraFields) {
  return callFeatureService(formatPointUri(point.latitude, point.longitude, extraFields));
}

/**
 * @param {string|string[]} name
 * @param {string} extraFields
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByName(name, extraFields) {
  const names = name.constructor === Array ? name : [name];
  if (!names.length) return Promise.reject('No names specified to fetch; no places match query');
  return callFeatureService(formatNameUri(names, extraFields));
}

/**
 * @param {string|string[]} id
 * @param {string} extraFields
 * @returns {Promise.<Array<{id: string, name: string, layer: string, bbox: number[]}>>}
 */
function fetchById(id, extraFields) {
  const ids = id.constructor === Array ? id : [id];
  if (!ids.length) return Promise.reject('No ids specified to fetch; no places match query');
  return callFeatureService(formatIdsUri(ids, extraFields));
}

module.exports = {
  fetchById: trackDependency(fetchById, 'FeatureService', 'fetchById'),
  fetchByBbox: trackDependency(fetchByBbox, 'FeatureService', 'fetchByBbox'),
  fetchByPoint: trackDependency(fetchByPoint, 'FeatureService', 'fetchByPoint'),
  fetchByName: trackDependency(fetchByName, 'FeatureService', 'fetchByName')
};