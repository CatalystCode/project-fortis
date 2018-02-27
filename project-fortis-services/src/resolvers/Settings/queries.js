'use strict';

const Promise = require('promise');
const tar = require('tar');
const fs = require('fs-extra');
const uuidv4 = require('uuid/v4');
const isDate = require('lodash/isDate');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const zip = require('lodash/zip');
const isUUID = require('is-uuid').anyNonNil;
const { basename } = require('path');
const { createArrayCsvWriter } = require('csv-writer');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const { withRunTime, getTermsByCategory, getSiteDefinition, createTempDir } = require('../shared');
const { trackException, trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const loggingClient = require('../../clients/appinsights/LoggingClient');
const { uploadFile } = require('../../clients/storage/BlobStorageClient');
const { requiresRole } = require('../../auth');
const { hideSecret, isSecretParam, cassandraRowToStream } = require('./shared');

function users(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    cassandraConnector.executeQuery('SELECT * FROM settings.users', [])
      .then(rows => {
        const users = rows.map(cassandraRowToUser);
        resolve({
          users
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function cassandraRowToUser(row) {
  return {
    identifier: row.identifier,
    role: row.role
  };
}

function terms(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const { translationLanguage, category } = args;

    getTermsByCategory(translationLanguage, category)
      .then(resolve)
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function sites(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    getSiteDefinition()
      .then(value => {
        hideSecret(value.site.properties, 'translationSvcToken');
        hideSecret(value.site.properties, 'cogSpeechSvcToken');
        hideSecret(value.site.properties, 'cogVisionSvcToken');
        hideSecret(value.site.properties, 'cogTextSvcToken');
        resolve(value);
      })
      .catch(reject);
  });
}

function streams(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    cassandraConnector.executeQuery('SELECT * FROM settings.streams', [])
      .then(rows => {
        const streams = rows.map(cassandraRowToStream);

        streams.forEach(stream => {
          stream.params.forEach(param => {
            if (isSecretParam(param.key)) {
              hideSecret(param, 'value');
            }
          });
        });

        resolve({
          streams
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function trustedSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM settings.trustedsources';
    const params = [];

    cassandraConnector.executeQuery(query, params)
      .then(rows => resolve({
        sources: rows.map(cassandraRowToSource)
      }))
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function cassandraRowToSource(row) {
  return {
    rowKey: row.pipelinekey + ',' + row.externalsourceid + ',' + row.rank,
    externalsourceid: row.externalsourceid,
    displayname: row.displayname || row.externalsourceid,
    pipelinekey: row.pipelinekey,
    rank: row.rank,
    reportingcategory: row.reportingcategory
  };
}

function cassandraRowToTermFilter(row) {
  let filteredTerms;
  try {
    filteredTerms = row.conjunctivefilter_json ? JSON.parse(row.conjunctivefilter_json) : [];
  } catch (err) {
    console.error(`Unable to parse term filter '${row.conjunctivefilter_json}' for blacklist item ${row.id}`);
    filteredTerms = [];
  }

  return {
    id: row.id,
    isLocation: !!row.islocation,
    filteredTerms
  };
}

function termBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const blacklistQuery = 'SELECT id, conjunctivefilter_json, islocation FROM settings.blacklist';
    cassandraConnector.executeQuery(blacklistQuery, [])
      .then(rows => {
        const filters = rows.map(cassandraRowToTermFilter);
        resolve({ filters });
      })
      .catch(reject);
  });
}

const MONTHS = 43800;

function exportSite(args, res) { // eslint-disable-line no-unused-vars
  const tablesToExport = ['streams', 'watchlist', 'sitesettings', 'blacklist', 'trustedsources'];
  const container = 'site-export';
  const expiryMinutes = 2 * MONTHS;
  const encoding = 'utf-8';

  function formatArchiveFileName(siteName) {
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${now.getUTCMonth() + 1}/${now.getUTCDate()}/${now.getUTCHours()}/${now.getUTCMinutes()}/${uuidv4()}`;
    return `${folder}/${siteName}.tar.gz`;
  }

  function formatExportQuery(tableName) {
    return `SELECT * FROM settings.${tableName}`;
  }

  function formatImportQuery(tableName) {
    return `COPY settings.${tableName} FROM '${tableName}.csv' WITH NULL='null';`;
  }

  return new Promise((resolve, reject) => {
    let workspace = '';
    let siteName = '';
    let exportedTables = [];
    let archiveFilePaths = [];
    let archivePath = '';
    let archiveBlob = {};

    getSiteDefinition()
      .then(({ site }) => {
        siteName = site.name;
        return createTempDir({ prefix: `${container}_${siteName}`});
      })
      .then((tempDir) => {
        workspace = tempDir;
        return Promise.all(tablesToExport.map(tableName =>
          cassandraConnector.executeQuery(formatExportQuery(tableName), [])));
      })
      .then((exported) => {
        const csvsToWrite = zip(tablesToExport, exported).filter((kv) => kv[1].length > 0);
        return Promise.all(csvsToWrite.map(([tableName, rows]) => {
          if (tableName === 'sitesettings') {
            // hack: set sitename to a well-known value so that it can be
            // adapted to the deployed site name during site import
            // see cqlsh import code in run-node.sh for details
            rows.forEach(row => row.sitename = 'Fortis Dev');
          }

          const records = rows.map(row => Object.values(row).map(item => {
            if (item == null) {
              return null;
            } else if (isDate(item)) {
              return item.toISOString();
            } else if (isUUID(item.toString())) {
              return item.toString();
            } else if (isArray(item) || isObject(item)) {
              return JSON.stringify(item).replace(/"/g, '\'');
            } else {
              return item;
            }
          }));

          const csvPath = `${workspace}/${tableName}.csv`;
          archiveFilePaths.push(csvPath);
          exportedTables.push(tableName);

          return createArrayCsvWriter({ path: csvPath, encoding }).writeRecords(records);
        }));
      })
      .then(() => {
        const importScriptPath = `${workspace}/import.cql`;
        const importScript = exportedTables.map(formatImportQuery).join('\n');
        archiveFilePaths.push(importScriptPath);
        return fs.outputFile(importScriptPath, importScript, encoding);
      })
      .then(() => {
        archivePath = `${workspace}/${siteName}.tar.gz`;
        const archiveFiles = archiveFilePaths.map(filePath => basename(filePath));
        return tar.create({ gzip: true, file: archivePath, cwd: workspace }, archiveFiles);
      })
      .then(() => {
        return uploadFile(container, formatArchiveFileName(siteName), archivePath, expiryMinutes);
      })
      .then((blob) => {
        archiveBlob = blob;
        return fs.remove(workspace);
      })
      .then(() => {
        archiveBlob.expires = archiveBlob.expires.toISOString();
        return resolve(archiveBlob);
      })
      .catch(reject);
  });
}

module.exports = {
  exportSite: requiresRole(trackEvent(withRunTime(exportSite), 'exportSite'), 'admin'),
  users: requiresRole(trackEvent(withRunTime(users), 'users', loggingClient.usersExtraProps(), loggingClient.usersExtraMetrics()), 'user'),
  sites: requiresRole(trackEvent(withRunTime(sites), 'sites'), 'user'),
  streams: requiresRole(trackEvent(withRunTime(streams), 'streams', loggingClient.streamsExtraProps(), loggingClient.streamsExtraMetrics()), 'user'),
  siteTerms: requiresRole(trackEvent(withRunTime(terms), 'terms', loggingClient.termsExtraProps(), loggingClient.keywordsExtraMetrics()), 'user'),
  trustedSources: requiresRole(trackEvent(withRunTime(trustedSources), 'trustedSources', loggingClient.trustedSourcesExtraProps(), loggingClient.trustedSourcesExtraMetrics()), 'user'),
  termBlacklist: requiresRole(trackEvent(withRunTime(termBlacklist), 'termBlacklist'), 'user')
};