'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const distance = cassandra.types.distance;
const asyncEachLimit = require('async/eachLimit');
const chunk = require('lodash/chunk');
const { trackDependency, trackException } = require('../appinsights/AppInsightsClient');
const loggingClient = require('../appinsights/LoggingClient');

const {
  fetchSize, maxOperationsPerBatch, maxConcurrentBatches,
  coreConnectionsPerHostLocal, coreConnectionsPerHostRemote,
  cassandraHost, cassandraPort,
  cassandraPassword, cassandraUsername
} = require('../../../config').cassandra;

const options = {
  contactPoints: [cassandraHost],
  pooling: {
    coreConnectionsPerHost: {
      [distance.local]: coreConnectionsPerHostLocal,
      [distance.remote]: coreConnectionsPerHostRemote
    }
  },
  protocolOptions: {
    port: cassandraPort,
  },
  queryOptions: {
    autoPage: true,
    prepare: true,
    fetchSize: fetchSize
  }
};
if (cassandraUsername && cassandraPassword) {
  options.authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraUsername, cassandraPassword);
}
const client = new cassandra.Client(options);

const status = {
  isInitialized: false
};

/**
 * @param {Array<{query: string, params: Array<string|map>}>} mutations
 * @returns {Promise}
 */
function executeBatchMutations(mutations) {
  return new Promise((resolve, reject) => {
    if (!client) {
      loggingClient.logCassandraClientUndefined();
      return reject('No Cassandra client defined');
    }

    if (!mutations || !mutations.length) {
      loggingClient.logNoMutationsDefined();
      return reject('No mutations defined');
    }

    let chunkedMutations = chunk(mutations, maxOperationsPerBatch);

    asyncEachLimit(chunkedMutations, maxConcurrentBatches, (chunk, asyncCallback) => {
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
      if (err) {
        trackException(err);
        reject(err);
      } else {
        resolve({numBatchMutations: chunkedMutations.length});
      }
    });
  });
}

/**
 * @param {string} query
 * @param {string[]} params
 * @param {{fetchSize: int}} [options]
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params, options) {
  return new Promise((resolve, reject) => {
    if (!client) {
      loggingClient.logCassandraClientUndefined();
      return reject('No Cassandra client defined');
    }

    try {
      const rows = [];
      const stream = client.stream(query, params, options)
        .on('readable', () => {
          let row;
          while ((row = stream.read()) != undefined) {
            rows.push(row);
          }
        })
        .on('error', err => {
          if (err) {
            loggingClient.logExecuteQueryError();
            reject(err);
          }
        })
        .on('end', () => {
          resolve(rows);
        });
    } catch (exception) {
      trackException(exception);
      reject(exception);
    }
  });
}

/**
 * @param {string} query
 * @param {string[]} params
 * @param {int} fetchSize
 * @param {string} pageState
 * @returns {Promise.<object[]>}
 */
function executeQueryWithPageState(query, params, pageState, fetchSize) {
  return new Promise((resolve, reject) => {
    if (!client) {
      loggingClient.logCassandraClientUndefined();
      return reject('No Cassandra client defined');
    }

    const DEFAULT_FETCH = 15;

    let options = {
      fetchSize: fetchSize > 0 ? fetchSize : DEFAULT_FETCH
    };

    if (pageState) {
      options.pageState = pageState;
    }

    client.execute(query, params, options)
      .then(result => {
        resolve({
          pageState: result.pageState,
          rows: result.rows
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

/**
 * Should be called on server start to warm up the connection to
 * Cassandra so that subsequent calls are fast.
 * @returns {Promise}
 */
function intialize() {
  return new Promise((resolve, reject) => {
    executeQuery('SELECT sitename FROM fortis.sitesettings LIMIT 1', [])
      .then(() => {
        status.isInitialized = true;
        console.log(`Established connection to cassandra at contact points ${cassandraHost}:${cassandraPort}`);
        resolve();
      })
      .catch(reject);
  });
}

module.exports = {
  status,
  initialize: trackDependency(intialize, 'Cassandra', 'initialize'),
  executeBatchMutations: trackDependency(executeBatchMutations, 'Cassandra', 'executeBatchMutations'),
  executeQueryWithPageState: trackDependency(executeQueryWithPageState, 'Cassandra', 'executeQueryWithPageState'),
  executeQuery: trackDependency(executeQuery, 'Cassandra', 'executeQuery')
};