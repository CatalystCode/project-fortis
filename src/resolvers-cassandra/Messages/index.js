'use strict';

const mutations = require('./mutations');
const queries = require('./queries');

module.exports = {
  publishEvents: mutations.publishEvents,

  byLocation: queries.byLocation,
  byBbox: queries.byBbox,
  byEdges: queries.byEdges,
  event: queries.event,
  translate: queries.translate,
  translateWords: queries.translateWords
};
