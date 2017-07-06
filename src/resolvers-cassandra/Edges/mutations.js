'use strict';

const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function removeKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.edges || !args.edges.length) return reject('No keywords to remove specified');

    const mutations = args.edges.map(edge => ({
      mutation: 'DELETE FROM fortis.watchlist WHERE keyword = ?',
      params: [edge.name]
    }));

    cassandraConnector.executeBatchMutations(mutations)
    .then(_ => { // eslint-disable-line no-unused-vars
      resolve({
        edges: args.edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function addKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.edges || !args.edges.length) return reject('No keywords to add specified');

    const mutations = args.edges.map(edge => ({
      mutation: 'INSERT INTO fortis.watchlist (keyword) VALUES (?)',
      params: [edge.name]
    }));

    cassandraConnector.executeBatchMutations(mutations)
    .then(_ => { // eslint-disable-line no-unused-vars
      resolve({
        edges: args.edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function saveLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    return reject(
      'This API call is no longer supported. ' +
      'We now automatically filter events down to only those ' +
      'locations defined in the geo-fence for your site'
    );
  });
}

/**
 * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function removeLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    return reject(
      'This API call is no longer supported. ' +
      'We now automatically filter events down to only those ' +
      'locations defined in the geo-fence for your site'
    );
  });
}

module.exports = {
  removeKeywords: trackEvent(withRunTime(removeKeywords), 'removeKeywords'),
  addKeywords: trackEvent(withRunTime(addKeywords), 'addKeywords'),
  saveLocations: trackEvent(withRunTime(saveLocations), 'saveLocations'),
  removeLocations: trackEvent(withRunTime(removeLocations), 'removeLocations')
};
