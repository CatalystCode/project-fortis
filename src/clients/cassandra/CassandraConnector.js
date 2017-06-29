'use strict';

const Promise = require('promise');

module.exports = {
  executeBatchMutations: executeBatchMutations,
  executeQuery: executeQuery  
};

/** Execute a batch of mutations
 * @param {Array<{mutation: string, params: Array<string|number|map}>} mutations
 * @returns {Promise}
 */
let executeBatchMutations = (mutations) => { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    
  });
};

  /** Execute a query
 * @param {{query: string, params: Array<string|number|map>}} query
 * @returns {Promise.<string>}
 */
let executeQuery = (query) => { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

  });
};