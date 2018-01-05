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
          query: `INSERT INTO fortis.watchlist (topicid, topic, lang_code, translations, insertiontime, category)
                VALUES (?, ?, ?, ?, toTimestamp(now()), ?);`,
          params: [uuid(), topic.topic, topic.lang_code, topic.translations, topic.category || '']
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

    cassandraConnector.executeQuery('SELECT * FROM fortis.sitesettings WHERE sitename = ?', [siteName])
      .then(rows => {
        if (!rows || !rows.length) return insertTopics(siteType);
        else return reject(`Sites with sitename ${siteName} already exist.`);
      })
      .then(() => {
        return cassandraConnector.executeBatchMutations([{
          query: `INSERT INTO fortis.sitesettings (
          geofence,
          defaultzoom,
          logo,
          title,
          sitename,
          languages,
          defaultlanguage,
          featureservicenamespace,
          insertiontime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()))`,
          params: [
            args.input.targetBbox,
            args.input.defaultZoomLevel,
            args.input.logo,
            args.input.title,
            args.input.name,
            args.input.supportedLanguages,
            args.input.defaultLanguage,
            args.input.featureServiceNamespace,
          ]
        }]);
      })
      .then(() => {
        streamingController.restartStreaming();
      })
      .then(() => {
        resolve({
          name: args.input.name,
          properties: {
            targetBbox: args.input.targetBbox,
            defaultZoomLevel: args.input.defaultZoomLevel,
            logo: args.input.logo,
            title: args.input.title,
            defaultLocation: args.input.defaultLocation,
            supportedLanguages:args.input.supportedLanguages
          }
        });
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
      console.log(`Site ${siteName} of type ${siteType} created!`);
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
