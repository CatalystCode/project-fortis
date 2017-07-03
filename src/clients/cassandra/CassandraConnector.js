'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const asyncEachLimit = require('async/eachLimit');

/** @see http://docs.datastax.com/en/developer/nodejs-driver/3.2/features/batch/
 * TODO: ASYNC_BATCH_LIMIT will need to be tuned.
 * It is best to keep the batch size small (in the order of 10s).
 * If the batch size is greater than 5k, then the server will issue a warning.
 */
const ASYNC_BATCH_LIMIT = process.env.ASYNC_BATCH_LIMIT || 10;

/** Default Cassandra Client Options
 * @see https://github.com/datastax/nodejs-driver/blob/master/lib/client-options.js
 * 
 * Cassandra Client Configurable Options
 * @see https://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/
 * 
 * Since datastax node driver does not have much detail on pooling, the java driver doc will be used:
 * @see http://docs.datastax.com/en/developer/java-driver/3.3/manual/pooling/
 * 
 * Connection pools have a variable size, which gets adjusted automatically depending on the current load. 
 * There will always be at least the core number of connections. The connection pool will pick 
 * the connection with the minimum number of in-flight requests.
 * 
 * Cassandra version 2.1 or greater can send up to 32768 requests (stream ids) per connection.
 * 
 * CORE_CONNECTIONS_PER_HOST: to tune this option see java-driver 3.3 manual: 'Tuning protocol v3 for very high throughputs'
 * 
 * TODO: consider sslOptions and authProvider
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
  }
};

const client = new cassandra.Client(options);

/** Execute mutations
 * @param {Array<{mutation: string, params: Array<string|map>}>} mutations
 * @returns {Promise}
 */
function executeMutations(mutations) {
  return new Promise((resolve, reject) => {
    if(!client) return reject('No Cassandra client defined');
    if(!mutations || mutations.length == 0) return reject('No mutations defined');
    asyncEachLimit(mutations, ASYNC_BATCH_LIMIT, (mutation, asyncCallback) => {
      client.execute(mutation.query, mutation.params, { prepare: true }, (err) => {
        if(err) {
          console.log(err, `Mutation failed for ${JSON.stringify(mutation)}`);
          asyncCallback(err);
        } else {
          asyncCallback();
        }
      });
    },
    (err) => {
      if(err){
        console.log(`Error occured during the mutations: ${JSON.stringify(err)}`);
        reject(err);
      }else{
        console.log('Finished executing cassandra mutations');
        resolve();
      }
    });
  });
}

 * @param {string} query
 * @param {string[]} params
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

  });
}

module.exports = {
  executeMutations: executeMutations,
  executeQuery: executeQuery 
};