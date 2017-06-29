'use strict';

module.exports = {
    // ------------------------------------------------------------------------------------ queries

  /**
   * @param {{pageSize: number, skip: number, tagFilter: string[]}} args
   * @returns {Promise.<{runTime: string, type: string, facts: Array<{id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]}>}>}
   */
  list(args, res) { // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{id: string}} args
   * @returns {Promise.<{id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]}>}
   */
  get(args, res) { // eslint-disable-line no-unused-vars
  }
};