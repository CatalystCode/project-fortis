'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;
const flatten = require('lodash/flatten');
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

function makeDefaultClauses() {
  const clauses = [];
  const params = [];

  clauses.push('(pipeline IN (\'TadaWeb\', \'Bing\', \'CustomEvent\'))');

  return {clauses: clauses, params: params};
}

function makeListQueries(args) {
  const defaults = makeDefaultClauses();

  return args.tagFilter.map(keyword => {
    const clauses = defaults.clauses.slice();
    const params = defaults.params.slice();

    clauses.push('(detectedkeywords CONTAINS ?)');
    params.push(keyword);

    const query = `SELECT * FROM fortis.events WHERE (${clauses.join(' AND ')})`;
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
    Promise.all(queries.map(query => cassandraConnector.executeQuery(query.query, query.params)))
    .then(nestedRows => {
      const rows = flatten(nestedRows);
      const facts = rows.map(cassandraRowToFact);

      resolve({
        facts: facts
      });
    })
    .catch(reject);
  });
}

function makeGetQuery(args) {
  let {clauses, params} = makeDefaultClauses();

  clauses.push('(id = ?)');
  params.push(args.id);

  let query = `SELECT * FROM fortis.events WHERE ${clauses.join(' AND ')}`;
  return {query: query, params: params};
}

/**
 * @param {{id: string}} args
 * @returns {Promise.<Fact>}
 */
function get(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.id) return reject('No id specified to fetch');

    const query = makeGetQuery(args);
    return cassandraConnector.executeQuery(query.query, query.params)
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
