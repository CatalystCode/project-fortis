'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const cassandraTableStorageManager = require('../storageClients/CassandraTableStorageManager');

/** Default Cassandra Client Options
 * https://github.com/datastax/nodejs-driver/blob/master/lib/client-options.js
 * 
 * Cassandra Client Configurable Options
 * https://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/
 * 
 * Since datastax node driver does not have much detail on pooling, the java driver doc will be used:
 * http://docs.datastax.com/en/developer/java-driver/3.3/manual/pooling/
 * pooling: Used to preallocate connections to cassandra rather than wait for an open connection to cassandra.
 * 
 * Connection pools have a variable size, which gets adjusted automatically depending on the current load. 
 * There will always be at least the core number of connections.
 * 
 * Connection pool picks the connection with the minimum number of in-flight requests.
 * 
 * Cassandra version 2.1 or greater can send up to 32768 requests (stream ids) per connection.
 * 
 * CORE_CONNECTIONS_PER_HOST: to tune this option see java-driver 3.3 manual: 'Tuning protocol v3 for very high throughputs'
 * 
 * sslOptions
 * authProvider
 */
const distance = cassandra.types.distance;
const CORE_CONNECTIONS_PER_HOST = 1;
const options = {
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE,
  pooling: {
    coreConnectionsPerHost: {
      [distance.local]: CORE_CONNECTIONS_PER_HOST,
      [distance.remote]: CORE_CONNECTIONS_PER_HOST
    } 
  } //also set the load balancing policy since it effects this
  //authProvider:
  //sslOptions:
};

/** Code should share the same Client instance across the application i.e.
 * the client should be a singleton.
 * http://docs.datastax.com/en/developer/nodejs-driver/3.2/coding-rules/
 * 
 * Creating the cassandra client will fail if its client options property, contactPoints, is not set.
 * 
 * client.shutdown() shuts down all connections to all hosts.
 */
const client = new cassandra.Client(options);

module.exports = {
  executeBatchMutations: executeBatchMutations,
  executeQuery: executeQuery 
};

/** Execute a batch of mutations
 * @param {Array<{mutation: string, params: Array<string|number|map}>} mutations
 * @returns {Promise}
 */
let executeBatchMutations = (mutations) => {
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
};

/**
 * http://docs.datastax.com/en/developer/nodejs-driver/3.2/features/udfs/
 */
let executeQuery = (query) => { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

  });
};