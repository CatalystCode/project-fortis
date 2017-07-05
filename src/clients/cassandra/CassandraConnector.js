'use strict';

const cassandra = require('cassandra-driver');

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

const Promise = require('promise');

/** Execute a batch of mutations
 * @param {Array<{mutation: string, params: Array<string|number|map}>} mutations
 * @returns {Promise}
 */
function executeBatchMutations(mutations) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    
  });
}

/**
 * @param {string} query
 * @param {string[]} params
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    client.execute(query, params, {prepare:true}, (err, result)=>{
      if (err) {
        return reject(err);
      }
      else {
        return resolve(result.rows);
      }
    });
  });
}

module.exports = {
  executeBatchMutations: executeBatchMutations,
  executeQuery: executeQuery  
};