'use strict';

const Promise = require('promise');
const request = require('request');

const apiHost = process.env.FORTIS_FEATURE_SERVICE_HOST;

function formatIdsUri(ids) {
  return `http://${apiHost}/features/id/${ids.map(encodeURIComponent).join(',')}?include=bbox`;
}

function formatBboxUri(north, west, south, east) {
  return `http://${apiHost}/features/bbox/${north}/${west}/${south}/${east}`;
}

function formatPointUri(latitude, longitude) {
  return `http://${apiHost}/features/point/${latitude}/${longitude}`;
}

function formatNameUri(names) {
  return `http://${apiHost}/features/name/${names.map(encodeURIComponent).join(',')}`;
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
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByBbox(fence) {
  return callFeatureService(formatBboxUri(fence.north, fence.west, fence.south, fence.east));
}

/**
 * @param {{latitude: number, longitude: number}} point 
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByPoint(point) {
  return callFeatureService(formatPointUri(point.latitude, point.longitude));
}

/**
 * @param {string|string[]} name
 * @returns {Promise.<Array<{id: string, name: string, layer: string}>>}
 */
function fetchByName(name) {
  const names = name.constructor === Array ? name : [name];
  return callFeatureService(formatNameUri(names));
}

/**
 * @param {string|string[]} id
 * @returns {Promise.<Array<{id: string, name: string, layer: string, bbox: number[]}>>}
 */
function fetchById(id) {
  const ids = id.constructor === Array ? id : [id];
  return callFeatureService(formatIdsUri(ids));
}

module.export = {
  fetchById: fetchById,
  fetchByBbox: fetchByBbox,
  fetchByPoint: fetchByPoint,
  fetchByName: fetchByName
};