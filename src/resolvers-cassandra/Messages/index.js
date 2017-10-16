'use strict';

const mutations = require('./mutations');
const queries = require('./queries');

module.exports = {
  publishEvents: mutations.publishEvents,
  restartPipeline: mutations.restartPipeline,

  byLocation: queries.byLocation,
  byBbox: queries.byBbox,
  byEdges: queries.byEdges,
  byPipeline: queries.byPipeline,
  event: queries.event,
  translate: queries.translate,
  translateWords: queries.translateWords
};
