'use strict';

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