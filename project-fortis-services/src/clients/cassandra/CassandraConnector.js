'use strict';

const Promise = require('promise');
const cassandra = require('cassandra-driver');
const { distance, consistencies } = cassandra.types;
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
  socketOptions: {
    connectTimeout: 10000, // milliseconds
    readTimeout: 60000 // milliseconds
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
      return reject('No DB client available');
    }

    if (!mutations || !mutations.length) {
      loggingClient.logNoMutationsDefined();
      return reject('No mutations defined');
    }

    let chunkedMutations = chunk(mutations, maxOperationsPerBatch);

    const options = {
      consistency: consistencies.localQuorum,
      prepare: true
    };

    asyncEachLimit(chunkedMutations, maxConcurrentBatches, (chunk, asyncCallback) => {
      try {
        client.batch(chunk, options, (err) => {
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
        console.error(err);
        reject('Error querying the DB');
      } else {
        resolve({numBatchMutations: chunkedMutations.length});
      }
    });
  });
}

/**
 * @param {string} query
 * @param {string[]} params
 * @param {{fetchSize: int, consistency: int}} [options]
 * @returns {Promise.<object[]>}
 */
function executeQuery(query, params, options) {
  if (!options) options = {};
  if (!options.consistency) options.consistency = consistencies.localQuorum;

  return new Promise((resolve, reject) => {
    if (!client) {
      loggingClient.logCassandraClientUndefined();
      return reject('No DB client available');
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
            console.error(err);
            return reject('Error querying the DB');
          }
        })
        .on('end', () => {
          resolve(rows);
        });
    } catch (err) {
      trackException(err);
      console.error(err);
      return reject('Error querying the DB');
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
      return reject('No DB client available');
    }

    const DEFAULT_FETCH = 15;

    let options = {
      consistency: consistencies.localQuorum,
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
      .catch(err => {
        trackException(err);
        console.error(err);
        return reject('Error querying the DB');
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
    executeQuery('SELECT sitename FROM settings.sitesettings LIMIT 1', [])
      .then(() => {
        status.isInitialized = true;
        console.log(`Established connection to cassandra at contact points ${cassandraHost}:${cassandraPort}`);
        resolve();
      })
      .catch(err => {
        trackException(err);
        console.error(err);
        return reject('Error initializing DB');
      });
  });
}

module.exports = {
  status,
  initialize: trackDependency(intialize, 'Cassandra', 'initialize'),
  executeBatchMutations: trackDependency(executeBatchMutations, 'Cassandra', 'executeBatchMutations'),
  executeQueryWithPageState: trackDependency(executeQueryWithPageState, 'Cassandra', 'executeQueryWithPageState'),
  executeQuery: trackDependency(executeQuery, 'Cassandra', 'executeQuery')
};