'use strict';

const Promise = require('promise');
const request = require('request');
const { trackDependency } = require('../appinsights/AppInsightsClient');
const azure = require('azure-storage');
const { minutesFromNow } = azure.date;
const { READ } = azure.BlobUtilities.SharedAccessPermissions;

const USER_FILES_BLOB_ACCOUNT_NAME = process.env.USER_FILES_BLOB_ACCOUNT_NAME;
const USER_FILES_BLOB_ACCOUNT_KEY = process.env.USER_FILES_BLOB_ACCOUNT_KEY;

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

/**
 * @param {string} container
 * @param {string} fileName
 * @param {string} content
 * @param {number} expiryMinutes
 * @returns {Promise.<{url: string, expires: Date}>}
 */
function createFile(container, fileName, content, expiryMinutes) {
  const client = azure.createBlobService(USER_FILES_BLOB_ACCOUNT_NAME, USER_FILES_BLOB_ACCOUNT_KEY);

  return new Promise((resolve, reject) => {
    client.createContainerIfNotExists(container, (error) => {
      if (error) return reject(error);

      client.createBlockBlobFromText(container, fileName, content, (error) => {
        if (error) return reject(error);

        const expires = minutesFromNow(expiryMinutes);
        const accessSignature = client.generateSharedAccessSignature(container, fileName, { AccessPolicy: { Expiry: expires, Permissions: READ } });
        const url = client.getUrl(container, fileName, accessSignature, true);

        resolve({
          url,
          expires
        });
      });
    });
  });
}

module.exports = {
  createFile: trackDependency(createFile, 'BlobStorage', 'createFile'),
  fetchJson: trackDependency(fetchJson, 'BlobStorage', 'fetchJson')
};