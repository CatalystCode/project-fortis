'use strict';

const Promise = require('promise');
const request = require('request');

const accessToken = process.env.FACEBOOK_AUTH_TOKEN;
const apiHost = process.env.FACEBOOK_API_HOST || 'graph.facebook.com';

function buildFeedUri(pageId) {
  return `https://${apiHost}/v2.9/${pageId}/feed`
    + `?access_token=${accessToken}`
    + '&format=json';
}

function fetchPageLastUpdatedAt(pageId) {
  return new Promise((resolve, reject) => {
    request.get(buildFeedUri(pageId), (err, response, body) => {
      if (err || response.statusCode !== 200) {
        reject(`Unable to call Facebook API: ${err}`);
        return;
      }

      let feed;
      try {
        feed = JSON.parse(body);
      } catch (err) {
        reject(`Unable to parse JSON for feed response ${body}: ${err}`);
        return;
      }

      const lastPostTime = feed && feed.data && feed.data.length && feed.data[0] && feed.data[0].created_time;
      if (!lastPostTime) {
        reject(`Unable to look up last post time in feed response: ${body}`);
        return;
      }

      resolve(lastPostTime);
    });
  });
}

module.exports = {
  fetchPageLastUpdatedAt: fetchPageLastUpdatedAt
};