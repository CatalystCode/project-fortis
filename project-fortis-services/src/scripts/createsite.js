#!/usr/bin/env node

'use strict';

const Promise = require('promise');
const uuid = require('uuid/v4');
const cassandraConnector = require('../clients/cassandra/CassandraConnector');
const streamingController = require('../clients/streaming/StreamingController');
const blobStorageClient = require('../clients/storage/BlobStorageClient');

const {
  fortisCentralAssetsHost
} = require('../../config').storage;

function insertTopics(siteType) {
  return new Promise((resolve, reject) => {
    if (!siteType || !siteType.length) return reject('insertTopics: siteType is not defined');

    const uri = `${fortisCentralAssetsHost}/settings/siteTypes/${siteType}/topics/defaultTopics.json`;
    let mutations = [];
    blobStorageClient.fetchJson(uri)
      .then(response => {
        return response.map(topic => ({
          query: `INSERT INTO settings.watchlist (topicid, topic, lang_code, translations_json, insertiontime, category)
                VALUES (?, ?, ?, ?, toTimestamp(now()), ?);`,
          params: [uuid(), topic.topic, topic.lang_code, JSON.stringify(topic.translations || {}), topic.category || '']
        }));
      })
      .then(response => {
        mutations = response;
        return cassandraConnector.executeBatchMutations(response);
      })
      .then(() => {
        streamingController.notifyWatchlistUpdate();
      })
      .then(() => {
        resolve({
          numTopicsInserted: mutations.length
        });
      })
      .catch(reject);
  });
}

function createSite(args) {
  return new Promise((resolve, reject) => {
    const siteName = args && args.input && args.input.name;
    const siteType = args && args.input && args.input.siteType;
    if (!siteName || !siteName.length) return reject('siteName is not defined');
    if (!siteType || !siteType.length) return reject('siteType is not defined');

    const siteQuery = 'SELECT * FROM settings.sitesettings WHERE sitename = ?';
    const siteQueryParams = [siteName];

    cassandraConnector.executeQuery(siteQuery, siteQueryParams)
      .then(rows => {
        if (rows && rows.length) {
          return resolve(`Site with sitename ${siteName} already exists.`);
        } else {
          return insertTopics(siteType);
        }
      })
      .then(() => {
        return cassandraConnector.executeBatchMutations([{
          query: `INSERT INTO settings.sitesettings (
          geofence_json,
          defaultzoom,
          logo,
          title,
          sitename,
          languages_json,
          defaultlanguage,
          featureservicenamespace,
          insertiontime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()))`,
          params: [
            JSON.stringify(args.input.targetBbox),
            args.input.defaultZoomLevel,
            args.input.logo,
            args.input.title,
            args.input.name,
            JSON.stringify(Array.from(args.input.supportedLanguages || [])),
            args.input.defaultLanguage,
            args.input.featureServiceNamespace,
          ]
        }]);
      })
      .then(() => {
        streamingController.restartStreaming();
      })
      .then(() => cassandraConnector.executeQuery(siteQuery, siteQueryParams))
      .then(addedSite => {
        if (addedSite.length === 1) {
          resolve(`Site with sitename ${siteName} of type ${siteType} created.`);
        } else {
          reject('Tried to add site but query-back did not return it');
        }
      })
      .catch(reject);
  });
}

function createSiteWithDefaults(siteName, siteType) {
  return createSite({
    input: {
      siteType: siteType,
      targetBbox: [0, 0, 0, 0],
      defaultZoomLevel: 8,
      logo: '',
      title: siteName,
      name: siteName,
      defaultLocation: [],
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      featureServiceNamespace: 'wof'
    }
  });
}

function cli() {
  if (process.argv.length !== 4) {
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <siteName> <siteType>`);
    process.exit(1);
  }

  const siteName = process.argv[2];
  const siteType = process.argv[3];

  cassandraConnector.initialize()
    .then(() => createSiteWithDefaults(siteName, siteType))
    .then(result => {
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error(`Failed to create site ${siteName}.`);
      console.error(error);
      process.exit(1);
    });
}

cli();
