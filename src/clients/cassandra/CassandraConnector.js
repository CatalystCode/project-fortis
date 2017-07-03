'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const asyncEachLimit = require('async/eachLimit');
const array = require('lodash/array');
const BATCH_LIMIT = process.env.BATCH_LIMIT || 10;
const ASYNC_OPERATIONS_LIMIT = process.env.ASYNC_OPERATIONS_LIMIT || 50;
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
 * @param {Array<{mutation: string, params: Array<string|map>}>} mutations
 * @returns {Promise}
 */
function executeMutations(mutations) {
  return new Promise((resolve, reject) => {
    if (!client) return reject('No Cassandra client defined');
    if (!mutations || mutations.length == 0) return reject('No mutations defined');
  
    let chunkedMutations = array.chunk(mutations, BATCH_LIMIT);

    asyncEachLimit(chunkedMutations, ASYNC_OPERATIONS_LIMIT, (chunk, asyncCallback) => {
      client.batch(chunk, { prepare: true }, (err) => {
        if (err) {
          console.log(err, `Mutations failed for ${JSON.stringify(chunk)}`);
          asyncCallback(err);
        } else {
          asyncCallback();
        }
      });
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

function executeQuery(query) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

  });
}

module.exports = {
  executeMutations: executeMutations,
  executeQuery: executeQuery 
};