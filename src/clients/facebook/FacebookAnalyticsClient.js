'use strict';

const Promise = require('promise');
const request = require('request');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const accessToken = process.env.FACEBOOK_AUTH_TOKEN;
const apiUrlBase = process.env.FACEBOOK_API_HOST || 'https://graph.facebook.com';

function buildFeedUri(pageId) {
  return `${apiUrlBase}/v2.9/${pageId}/feed`
    + `?access_token=${accessToken}`
    + '&format=json';
}

function fetchPageLastUpdatedAt(pageId) {
  return new Promise((resolve, reject) => {
    request.get(buildFeedUri(pageId), (err, response, body) => {
      if (err || response.statusCode !== 200) {
        return reject(`Unable to call Facebook API: ${err}`);
      }

      let feed;
      try {
        feed = JSON.parse(body);
      } catch (err) {
        return reject(`Unable to parse JSON for feed response ${body}: ${err}`);
      }

      const lastPostTime = feed && feed.data && feed.data.length && feed.data[0] && feed.data[0].created_time;
      if (!lastPostTime) {
        return reject(`Unable to look up last post time in feed response: ${body}`);
      }

      resolve(lastPostTime);
    });
  });
}

module.exports = {
  fetchPageLastUpdatedAt: trackDependency(fetchPageLastUpdatedAt, 'Facebook', 'pageLastUpdatedAt')
};