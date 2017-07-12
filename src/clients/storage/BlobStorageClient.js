'use strict';

const Promise = require('promise');
const request = require('request');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

/**
 * @param {string} uri
 * @returns {Promise.<Array<Object>>}
*/
function fetchJson(uri) {
  return new Promise((resolve, reject) => {
    request.get(uri, (err, response, body) => {
      if(err || response.statusCode !== 200) {
        return reject(`Unable to get json for uri ${uri}: ${err}`);
      }

      let json;
      try {
        json = JSON.parse(body);
      } catch (err) {
        return reject(`Unable to parse JSON for response ${body}: ${err}`);
      }

      resolve(json);
    });
  });
}

module.exports = {
  fetchJson: trackDependency(fetchJson, 'BlobStorage', 'fetchJson')
};