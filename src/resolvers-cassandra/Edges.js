'use strict';

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  removeKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  addKeywords(args, res){ // eslint-disable-line no-unused-vars
  },

  saveLocations(args, res){ // eslint-disable-line no-unused-vars
    // this is now handled by spark:
    // we get the coordinates of the geofence
    // that is configured in the sitesettings table
    // and use those to filter the twitter stream
    return null;
  },

  removeLocations(args, res){ // eslint-disable-line no-unused-vars
    // this is now handled by spark:
    // we get the coordinates of the geofence
    // that is configured in the sitesettings table
    // and use those to filter the twitter stream
    return null;
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