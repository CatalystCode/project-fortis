'use strict';

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function removeKeywords(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, edges: Array<{name: string}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function addKeywords(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function saveLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    reject(
      'This API call is no longer supported. ' +
      'We now automatically filter events down to only those ' +
      'locations defined in the geo-fence for your site'
    );
  });
}

/**
 * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
 */
function removeLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    reject(
      'This API call is no longer supported. ' +
      'We now automatically filter events down to only those ' +
      'locations defined in the geo-fence for your site'
    );
  });
}

module.exports = {
  removeKeywords: removeKeywords,
  addKeywords: addKeywords,
  saveLocations: saveLocations,
  removeLocations: removeLocations
};
