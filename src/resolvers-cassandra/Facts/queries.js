'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const cross = require('../../utils/collections').cross;
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {id: string, language: string, title: string, tags: string[], date: string, link: string, text: string, sources: string[]} Fact
 */

function cassandraRowToFact(row) {
  return {
    id: row.id,
    language: row.eventlangcode,
    title: row.title,
    tags: row.detectedkeywords,
    date: row.event_time,
    link: row.sourceurl,
    text: row.messagebody,
    sources: row.pipeline && [row.pipeline]
  };
}

const SUPPORTED_PIPELINES = ['tadaweb', 'bing', 'customevent'];

function makeListQueries(args) {
  return cross(args.tagFilter, SUPPORTED_PIPELINES).map(keywordAndPipeline => {
    const clauses = [];
    const params = [];

    if (keywordAndPipeline.a) {
      clauses.push('(detectedkeywords CONTAINS ?)');
      params.push(keywordAndPipeline.a);
    }

    if (keywordAndPipeline.b) {
      clauses.push('(pipeline = ?)');
      params.push(keywordAndPipeline.b);
    }

    const query = `SELECT * FROM fortis.events WHERE ${clauses.join(' AND ')} ALLOW FILTERING`;
    return {query: query, params: params};
  });
}

/**
 * @param {{pageSize: number, skip: number, tagFilter: string[]}} args
 * @returns {Promise.<{runTime: string, type: string, facts: Fact[]}>}
 */
function list(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.tagFilter || !args.tagFilter.length) return reject('No tags specified to fetch');

    const queries = makeListQueries(args);
    cassandraConnector.executeQueries(queries)
    .then(rows => {
      const facts = rows.map(cassandraRowToFact);

      resolve({
        facts: facts
      });
    })
    .catch(reject);
  });
}

function makeGetQueries(args) {
  return SUPPORTED_PIPELINES.map(pipeline => {
    const clauses = [];
    const params = [];

    clauses.push('(id = ?)');
    params.push(args.id);

    clauses.push('(pipeline = ?)');
    params.push(pipeline);

    let query = `SELECT * FROM fortis.events WHERE ${clauses.join(' AND ')} ALLOW FILTERING`;
    return {query: query, params: params};
  });
}

/**
 * @param {{id: string}} args
 * @returns {Promise.<Fact>}
 */
function get(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.id) return reject('No id specified to fetch');

    const queries = makeGetQueries(args);
    cassandraConnector.executeQueries(queries)
    .then(rows => {
      if (rows.length > 1) return reject(`Got more ${rows.length} faces with id ${args.id}`);
      resolve(cassandraRowToFact(rows[0]));
    })
    .catch(reject);
  });
}

module.exports = {
  list: trackEvent(withRunTime(list), 'listFacts'),
  get: trackEvent(get, 'getFact')
};
