#!/usr/bin/env node

'use strict';

const Promise = require('promise');
const cassandraConnector = require('../clients/cassandra/CassandraConnector');
const { getSiteDefinition } = require('../resolvers/shared');

function ingestSetting(settingName, columnName, value) {
  return new Promise((resolve, reject) => {
    if (!settingName) return reject('settingName is not defined');
    if (!columnName) return reject('columnName is not defined');
    if (!value) return reject('value is not defined');

    const query = `
    UPDATE fortis.sitesettings
    SET ${columnName} = ?
    WHERE sitename = ?
    `;

    getSiteDefinition()
      .then(({ site }) => {
        if (site.properties[settingName]) {
          return resolve(`Setting ${settingName} is already at value ${site.properties[settingName]}`);
        } else {
          return cassandraConnector.executeBatchMutations([{ query, params: [value, site.name] }]);
        }
      })
      .then(() => getSiteDefinition())
      .then(({ site }) => {
        if (site.properties[settingName] === value) {
          resolve(site);
        } else {
          reject('Tried to ingest setting but query-back did not return it');
        }
      })
      .catch(reject);
  });
}

function cli() {
  if (process.argv.length !== 5) {
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <settingName> <columnName> <value>`);
    process.exit(1);
  }

  const settingName = process.argv[2];
  const columnName = process.argv[3];
  const value = process.argv[4];

  cassandraConnector.initialize()
    .then(() => ingestSetting(settingName, columnName, value))
    .then(result => {
      console.log('Ingested setting');
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to ingest setting');
      console.error(error);
      process.exit(1);
    });
}

cli();
