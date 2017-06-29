'use strict';
let Promise = require('promise');
const cassandra = require('cassandra-driver');
const cassandraTableStorageManager = require('../storageClients/CassandraTableStorageManager');
const distance = cassandra.types.distance;

/** Cassandra Client Options
 * https://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/
 * 
 * pooling:
 * Used to preallocate connections to cassandra rather than wait for an open connection to cassandra.
 * 
 * CORE_CONNECTIONS_PER_HOST: 
 * TODO: 10 is a placeholder for now. Need to find a number that will not drain Cassandra.
 */
const CORE_CONNECTIONS_PER_HOST = 10;
const options = {
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE,
  pooling: {
    coreConnectionsPerHost: {
      [distance.local] : CORE_CONNECTIONS_PER_HOST,
      [distance.remote] : CORE_CONNECTIONS_PER_HOST
    } 
  }
};

/** Code should share the same Client instance across the application i.e.
 * the client should be a singleton.
 * http://docs.datastax.com/en/developer/nodejs-driver/3.2/coding-rules/
 * 
 * cassandra.Client will fail if its client options property, contactPoints, is not set.
 * 
 * TODO: Look into client.shutdown().
 * Does this close all the connections in the connection pool?
 * If one of the connections has an exception, I don't 
 * want shutdown to close all the connections in the pool.
 */
const client = new cassandra.Client(options);

module.exports = {

  /** Execute a batch of mutations
   * @param Array[preparedMutation] mutations - cassandra preparedMutation array
   * @param {Object} preparedMutation - cassandra prepared mutation object
   * @param {String} preparedMutation.mutation - cassandra mutation string
   * @param {Array}  preparedMutation.params - cassandra params
   * @return {Promise}
   */
  executeBatchMutations: (mutations) => {
    return new Promise((resolve, reject) => {
      if(!client) reject('Cassandra client is null');
      cassandraTableStorageManager.batchMutations(client, mutations, function(err) {
        if(err) {
          const errMsg = `[${err}] occured while performing a batch of mutations`;
          console.error(errMsg);
          reject(errMsg);
        } else {
          resolve();
        }
      });
    });
  },

  /** Execute a query
   * @param {Object} preparedQuery - cassandra prepared query object
   * @param {String} preparedQuery.query - query string
   * @param {Array}  preparedQuery.params - query params
   * @return {Promise}
   */
  executeQuery: (query) => { // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

    });
  }

};