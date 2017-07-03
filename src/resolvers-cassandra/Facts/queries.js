'use strict';

const withRunTime = require('../shared').withRunTime;

/**
 * @param {{pageSize: number, skip: number, tagFilter: string[]}} args
 * @returns {Promise.<{runTime: string, type: string, facts: Array<{id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]}>}>}
 */
function list(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{id: string}} args
 * @returns {Promise.<{id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]}>}
 */
function get(args, res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  list: withRunTime(list),
  get: get
};
