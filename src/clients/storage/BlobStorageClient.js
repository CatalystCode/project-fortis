'use strict';

const request = require('request');
const apiUrlBase = process.env.FORTIS_CENTRAL_ASSETS_HOST || 'https://fortiscentral.blob.core.windows.net';

function buildTopicsSiteTypeUri(siteType) {
  return `${apiUrlBase}/settings/siteTypes/${siteType}/topics/defaultTopics.json`;
}

/**
 * @param {string} siteType
 * @returns {Promise.<Array<{keyword: string, lang_code: string, insertion_time: timestamp, translations: Map<string, string>}>>}
*/
function fetchTopicsBySiteType(siteType) {
  return new Promise((resolve, reject) => {
    request.get(buildTopicsSiteTypeUri(siteType), (err, response, body) => {
      if(err || response.statusCode !== 200) {
        return reject(`Unable to get topics for siteType ${siteType}: ${err}`);
      }

      let topics;
      try {
        topics = JSON.parse(body);
      } catch (err) {
        return reject(`Unable to parse JSON for topics response ${body}: ${err}`);
      }

      resolve(topics);
    });
  });
}

module.exports = {
  fetchTopicsBySiteType: fetchTopicsBySiteType
};