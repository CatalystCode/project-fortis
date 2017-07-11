'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const asyncEachLimit = require('async/eachLimit');
const chunk = require('lodash/chunk');
const flatten = require('lodash/flatten');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const MAX_OPERATIONS_PER_BATCH = process.env.MAX_OPERATIONS_PER_BATCH || 10;
const MAX_CONCURRENT_BATCHES = process.env.MAX_CONCURRENT_BATCHES || 50;
const distance = cassandra.types.distance;
const CORE_CONNECTIONS_PER_HOST_LOCAL = process.env.CORE_CONNECTIONS_PER_HOST_LOCAL || 1;
const CORE_CONNECTIONS_PER_HOST_REMOTE = process.env.CORE_CONNECTIONS_PER_HOST_REMOTE || 1;
const options = {
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE,
  pooling: {
    coreConnectionsPerHost: {
      [distance.local]: CORE_CONNECTIONS_PER_HOST_LOCAL,
      [distance.remote]: CORE_CONNECTIONS_PER_HOST_REMOTE
    } 
  }
};
const client = new cassandra.Client(options);

/**
 * @param {Array<{query: string, params: Array<string|map>}>} mutations
 * @returns {Promise}
 */
function executeBatchMutations(mutations) {
  return new Promise((resolve, reject) => {
    if (!client) return reject('No Cassandra client defined');
    if (!mutations || !mutations.length) return reject('No mutations defined');
  
    let chunkedMutations = chunk(mutations, MAX_OPERATIONS_PER_BATCH);

    asyncEachLimit(chunkedMutations, MAX_CONCURRENT_BATCHES, (chunk, asyncCallback) => {
      try {
        client.batch(chunk, { prepare: true }, (err) => {
          if (err) {
            console.log(err, `Mutations failed for ${JSON.stringify(chunk)}`);
            asyncCallback(err);
          } else {
            asyncCallback();
          }
        });
      } catch (exception) {
        console.log(`Exception occured during the mutations: ${JSON.stringify(exception)}`);
        asyncCallback(exception);
      }
    },
    (err) => {
      if (err) {
        console.log(`Error occured during the mutations: ${JSON.stringify(err)}`);
        reject(err);
      } else {
        console.log('Finished executing cassandra mutations');
        resolve();
      }
    });
  });
}

/**
 * @param {string} query
 * @param {string[]} params
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    client.execute(query, params, { prepare: true }, (err, result) => {
      if (err) {
        console.log(`Error occured during executeQuery: ${JSON.stringify(err)}`);
        return reject(err);
      }
      else {
        return resolve(result.rows);
      }
    });
  });
}

/**
 * @param {Array<{query: string, params: string[]}} queries
 * @returns {Promise.<object[]>}
 */
function executeQueries(queries) {
  return new Promise((resolve, reject) => {
    Promise.all(queries.map(query => executeQuery(query.query, query.params)))
    .then(nestedRows => {
      const rows = flatten(nestedRows.filter(rowBunch => rowBunch && rowBunch.length));
      resolve(rows);
    })
    .catch(reject);
  });
}

module.exports = {
  executeBatchMutations: trackDependency(executeBatchMutations, 'Cassandra', 'executeBatchMutations'),
  executeQueries: trackDependency(executeQueries, 'Cassandra', 'executeQueries'),
  executeQuery: trackDependency(executeQuery, 'Cassandra', 'executeQuery')
};