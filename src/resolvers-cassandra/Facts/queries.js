'use strict';

const withRunTime = require('../shared').withRunTime;

/**
 * @typedef {id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]} Fact
 */

/**
 * @param {{pageSize: number, skip: number, tagFilter: string[]}} args
 * @returns {Promise.<{runTime: string, type: string, facts: Fact[]}>}
 */
function list(args, res) { // eslint-disable-line no-unused-vars
}

/**
 * @param {{id: string}} args
 * @returns {Promise.<Fact>}
 */
function get(args, res) { // eslint-disable-line no-unused-vars
}

module.exports = {
  list: withRunTime(list),
  get: get
};
