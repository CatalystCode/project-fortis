'use strict';

const Promise = require('promise');

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  removeKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  addKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  saveLocations(args, res){ // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      reject(
        'This API call is no longer supported. ' +
        'We now automatically filter events down to only those ' +
        'locations defined in the geo-fence for your site'
      );
    });
  },

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

  terms(args, res){ // eslint-disable-line no-unused-vars
  },

  locations(args, res){ // eslint-disable-line no-unused-vars
  },

  popularLocations(args, res){ // eslint-disable-line no-unused-vars
  },

  timeSeries(args, res){ // eslint-disable-line no-unused-vars
  },

  topSources(args,res) { // eslint-disable-line no-unused-vars
  }
};