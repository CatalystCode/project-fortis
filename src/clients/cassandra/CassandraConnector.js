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

let executeQuery = (query) => { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

  });
};