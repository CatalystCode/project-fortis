'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const asyncEachLimit = require('async/eachLimit');
const chunk = require('lodash/chunk');
const flatten = require('lodash/flatten');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const PAGE_SIZE = process.env.PAGE_SIZE || 5000;
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
            asyncCallback(err);
          } else {
            asyncCallback();
          }
        });
      } catch (exception) {
        asyncCallback(exception);
      }
    },
    (err) => {
      if (err) reject(err);
      else resolve({numBatchMutations: chunkedMutations.length});
    });
  });
}

/** Retrieves up to 5000 rows
 * @param {string} query
 * @param {string[]} params
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    try {
      client.execute(query, params, { prepare: true }, (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      });
    } catch (exception) {
      reject(exception);
    }
  });
}

/** Retrieves up to pageSize rows at a page offset provided by pageState
 * @param {string} query
 * @param {string[]} params
 * @param {string} [pageState]
 * @param {int} [pageSize]
 * @returns {Promise.<object[]>}
 */
function executeQueryWithPagination(query, params, pageState, pageSize=PAGE_SIZE) {
  return new Promise((resolve, reject) => {
    try {
      let options = {prepare: true, pageState : pageState, fetchSize: pageSize};
      let rows = [];
      client.eachRow(query, params, options, (n, row) => {
        rows.push(row);
      }, (err, result) => {
        if (err) reject(err);
        else resolve({
          rows: rows,
          pageState: result.pageState
        });
      });
    } catch (exception) {
      reject(exception);
    }
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
  executeQueryWithPagination: trackDependency(executeQueryWithPagination, 'Cassandra', 'executeQueryWithPagination'),
  executeQuery: trackDependency(executeQuery, 'Cassandra', 'executeQuery')
};