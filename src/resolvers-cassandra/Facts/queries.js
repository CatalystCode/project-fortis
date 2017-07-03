'use strict';

const Promise = require('promise');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const withRunTime = require('../shared').withRunTime;

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

function appendDefaultFilters(query, params) {
  query += ' AND pipeline IN ("TadaWeb", "Bing", "CustomEvent")';
  return {query: query, params: params};
}

function makeListQuery(args) {
  const tagsCondition = args.tagFilter.map(_ => 'detectedkeywords CONTAINS ?').join(' OR '); // eslint-disable-line no-unused-vars
  const query = `SELECT * FROM fortis.events WHERE (${tagsCondition})`;
  const params = args.tagFilter.slice();
  return appendDefaultFilters(query, params);
}

/**
 * @param {{pageSize: number, skip: number, tagFilter: string[]}} args
 * @returns {Promise.<{runTime: string, type: string, facts: Fact[]}>}
 */
function list(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.tagFilter || !args.tagFilter.length) return reject('No tags specified to fetch');

    const query = makeListQuery(args);
    return cassandraConnector.executeQuery(query.query, query.params)
    .then(rows => {
      const facts = rows.map(cassandraRowToFact);

      resolve({
        facts: facts
      });
    })
    .catch(reject);
  });
}

function makeGetQuery(args) {
  let query = 'SELECT * FROM fortis.events WHERE id = ?';
  let params = [args.id];
  return appendDefaultFilters(query, params);
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
  list: withRunTime(list),
  get: get
};
