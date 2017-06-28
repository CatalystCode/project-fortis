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
 * TODO: Do we need to have a check to see if the client is null after
 * cassandra.Client(options)? Look into this more to see if it will
 * ever fail.
 *  
 * TODO: Look into client.shutdown().
 * Does this close all the connections in the connection pool?
 * If one of the connections has an exception, I don't 
 * want shutdown to close all the connections in the pool.
 */
const client = new cassandra.Client(options);

module.exports = {

  /** Execute a batch of mutations
   * @param Array<{query, params}> mutations
   * @return {Promise}
   */
  executeBatchMutations: (mutations) => {
    return new Promise((resolve, reject) => {
      cassandraTableStorageManager.batch(client, mutations)
        .then(resolve)
        .catch(err => {
          const errMsg = `[${err}] occured while performing a batch of mutations`;
          console.error(errMsg);
          client.shutdown();
          reject(errMsg);
        });
    });
  }

};