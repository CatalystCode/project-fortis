'use strict';

const Promise = require('promise');

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  /**
   * @param {{input: {site: string, edges: Array<{name: string}>}}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
   */
  removeKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, edges: Array<{name: string}>}}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
   */
  addKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
   */
  saveLocations(args, res){ // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      reject(
        'This API call is no longer supported. ' +
        'We now automatically filter events down to only those ' +
        'locations defined in the geo-fence for your site'
      );
    });
  },

  /**
   * @param {{input: {site: string, targetBBox: number[], edges: Array<{name: string, type: string, alternatenames: string, coordinates: number[]}}>}}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
   */
  removeLocations(args, res){ // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      reject(
        'This API call is no longer supported. ' +
        'We now automatically filter events down to only those ' +
        'locations defined in the geo-fence for your site'
      );
    });
  },

  // ------------------------------------------------------------------------------------ queries

  /**
   * @param {{site: string, query: string, fromDate: string, toDate: string, sourceFilter: string[]}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string}>}>}
   */
  terms(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{site: string, query: string}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string, coordinates: number[]}>}>}
   */
  locations(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{site: string, langCode: string, limit: number, timespan: string, zoomLevel: number, layertype: string, sourceFilter: string[], fromDate: string, toDate: string}} args
   * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, coordinates: number[], population: number}>}>}
   */
  popularLocations(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{site: string, fromDate: string, toDate: string, zoomLevel: number, limit: number, layertype: string, sourceFilter: string[], mainEdge: string}} args
   * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
   */
  timeSeries(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{site: string, fromDate: string, toDate: string, limit: number, mainTerm: string, sourceFilter: string[]}} args
   * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
   */
  topSources(args,res) { // eslint-disable-line no-unused-vars
  }
};