'use strict';

const Promise = require('promise');
const uuid = require('uuid/v4');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const streamingController = require('../../clients/streaming/StreamingController');
const { PlaceholderForSecret, getSiteDefinition, withRunTime, limitForInClause } = require('../shared');
const { trackEvent, trackException } = require('../../clients/appinsights/AppInsightsClient');
const loggingClient = require('../../clients/appinsights/LoggingClient');
const { requiresRole } = require('../../auth');

function editSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const siteName = args && args.input && args.input.name;
    if (!siteName || !siteName.length) return reject('sitename is not defined');

    getSiteDefinition()
      .then(({ site }) => {
        return cassandraConnector.executeBatchMutations([{
          query: `UPDATE fortis.sitesettings
          SET geofence = ?,
          defaultzoom = ?,
          logo = ?,
          title = ?,
          languages = ?,
          defaultlanguage = ?,
          cogspeechsvctoken = ?,
          cogtextsvctoken = ?,
          cogvisionsvctoken = ?,
          featureservicenamespace = ?,
          mapSvcToken = ?,
          translationsvctoken = ?
        WHERE sitename = ?`,
          params: [
            args.input.targetBbox,
            args.input.defaultZoomLevel,
            args.input.logo,
            args.input.title,
            args.input.supportedLanguages,
            args.input.defaultLanguage,
            args.input.cogSpeechSvcToken === PlaceholderForSecret ? site.properties.cogSpeechSvcToken : args.input.cogSpeechSvcToken,
            args.input.cogTextSvcToken === PlaceholderForSecret ? site.properties.cogTextSvcToken : args.input.cogTextSvcToken,
            args.input.cogVisionSvcToken === PlaceholderForSecret ? site.properties.cogVisionSvcToken : args.input.cogVisionSvcToken,
            args.input.featureservicenamespace,
            args.input.mapSvcToken,
            args.input.translationSvcToken === PlaceholderForSecret ? site.properties.translationSvcToken : args.input.translationSvcToken,
            args.input.name
          ]
        }]);
      })
      .then(() => {
        streamingController.notifySiteSettingsUpdate();
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
            supportedLanguages:args.input.supportedLanguages,
            defaultLanguage: args.input.defaultLanguage,
            cogSpeechSvcToken: args.input.cogSpeechSvcToken,
            cogTextSvcToken: args.input.cogTextSvcToken,
            cogVisionSvcToken: args.input.cogVisionSvcToken,
            featureservicenamespace: args.input.featureservicenamespace,
            translationSvcToken: args.input.translationSvcToken
          }
        });
      })
      .catch(reject);
  });
}

function addTrustedSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.input || !args.input.sources || !args.input.sources.length) {
      loggingClient.logNoTrustedSourcesToAdd();
      return reject('No trustedsources to add specified.');
    }

    let mutations = [];
    args.input.sources.forEach(source => {
      mutations.push({
        query: `INSERT INTO fortis.trustedsources (
          pipelinekey,
          externalsourceid,
          sourcetype,
          rank,
          displayname,
          insertiontime,
          reportingcategory
        ) VALUES (?,?,?,?,?,dateof(now()),?)`,
        params: [
          source.pipelinekey,
          source.externalsourceid,
          source.sourcetype,
          source.rank,
          source.displayname,
          source.reportingcategory
        ]
      });
    });

    cassandraConnector.executeBatchMutations(mutations)
      .then(_ => { // eslint-disable-line no-unused-vars
        resolve({
          sources: args.input.sources
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function removeTrustedSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.input || !args.input.sources || !args.input.sources.length) {
      loggingClient.logNoTrustedSourcesToRemove();
      return reject('No trusted sources to remove specified.');
    }

    const mutations = args.input.sources.map(source => ({
      query: 'DELETE FROM fortis.trustedsources WHERE pipelinekey = ? AND externalsourceid = ? AND sourcetype = ? AND rank = ?',
      params: [source.pipelinekey, source.externalsourceid, source.sourcetype, source.rank]
    }));

    cassandraConnector.executeBatchMutations(mutations)
      .then(_ => { // eslint-disable-line no-unused-vars
        resolve({
          sources: args.input.sources
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function removeKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.input || !args.input.edges || !args.input.edges.length) {
      loggingClient.logNoKeywordsToRemove();
      return reject('No keywords to remove specified.');
    }

    const mutations = args.input.edges.map(edge => ({
      query: 'DELETE FROM fortis.watchlist WHERE topic = ? AND lang_code = ?',
      params: [edge.name, edge.namelang]
    }));

    cassandraConnector.executeBatchMutations(mutations)
      .then(() => {
        streamingController.notifyWatchlistUpdate();
      })
      .then(_ => { // eslint-disable-line no-unused-vars
        resolve({
          edges: args.input.edges
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

const MAX_KEYWORD_BYTE_SIZE = 40;

function addKeywords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.input || !args.input.edges || !args.input.edges.length) {
      loggingClient.logNoKeywordsToAdd();
      return reject('No keywords to add specified.');
    }

    const keywordByteLength = Buffer.byteLength(args.input.edges.map(edge => edge.name).join(' '));
    if (keywordByteLength > MAX_KEYWORD_BYTE_SIZE) {
      // refer to the twitter docs for the track api at https://aka.ms/Tw2fin for more context on the limitation
      return reject(`Keywords can be at most ${MAX_KEYWORD_BYTE_SIZE} bytes, got ${keywordByteLength}.`);
    }

    let mutations = [];
    args.input.edges.forEach(edge => {
      let params = paramEntryToMap(edge.translations);
      mutations.push({
        query: `INSERT INTO fortis.watchlist (
          topic,
          lang_code,
          category,
          insertiontime,
          topicid,
          translations
        ) VALUES (?,?,?,dateof(now()),?,?)`,
        params: [edge.name, edge.namelang, edge.category, edge.topicid, params]
      });
    });

    cassandraConnector.executeBatchMutations(mutations)
      .then(() => {
        streamingController.notifyWatchlistUpdate();
      })
      .then(_ => { // eslint-disable-line no-unused-vars
        resolve({
          edges: args.input.edges
        });
      })
      .catch(error => {
        trackException(error);
        reject(error);
      });
  });
}

function removeSite(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    cassandraConnector.executeBatchMutations([{
      query: 'DELETE FROM fortis.sitesettings WHERE sitename = ?;',
      params: [args.input.name]
    }])
      .then(() => {
        resolve({
          name: args.input.name,
          properties: {
            targetBbox: args.input.targetBbox,
            defaultZoomLevel: args.input.defaultZoomLevel,
            logo: args.input.logo,
            title: args.input.title,
            defaultLocation: args.input.defaultLocation,
            supportedLanguages: args.input.supportedLanguages
          }
        });
      })
      .catch(reject);
  });
}

function paramEntryToMap(paramEntry) {
  return paramEntry.reduce((obj, item) => (obj[item.key] = item.value, obj), {});
}

function modifyStreams(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const streams = args && args.input && args.input.streams;
    if (!streams || !streams.length) {
      loggingClient.logNoStreamParamsToEdit();
      return reject('No streams specified');
    }

    const mutations = [];
    streams.forEach(stream => {
      let params = paramEntryToMap(stream.params);
      mutations.push({
        query: `UPDATE fortis.streams
        SET pipelinelabel = ?,
        pipelineicon = ?,
        streamfactory = ?,
        params = ?,
        enabled = ?
        WHERE streamid = ? AND pipelinekey = ?`,
        params: [
          stream.pipelineLabel,
          stream.pipelineIcon,
          stream.streamFactory,
          params,
          stream.enabled,
          stream.streamId,
          stream.pipelineKey
        ]
      });
    });

    cassandraConnector.executeBatchMutations(mutations)
      .then(() => {
        streamingController.restartStreaming();
      })
      .then(() => {
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

function modifyBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const termFilters = args && args.input && args.input.filters;
    if (!termFilters || !termFilters.length) return reject('No blacklists to modify specified.');

    const mutations = [];
    const filterRecords = [];
    termFilters.forEach(termFilter => {
      if (termFilter.id) {
        mutations.push({
          query: 'UPDATE fortis.blacklist SET conjunctivefilter = ?, islocation = ? WHERE id = ?',
          params: [termFilter.filteredTerms, termFilter.isLocation, termFilter.id]
        });
      } else {
        termFilter.id = uuid();
        mutations.push({
          query: 'INSERT INTO fortis.blacklist (id, conjunctivefilter, islocation) VALUES (?, ?, ?)',
          params: [termFilter.id, termFilter.filteredTerms, termFilter.isLocation]
        });
      }
      filterRecords.push(termFilter);
    });

    cassandraConnector.executeBatchMutations(mutations)
      .then(() => {
        streamingController.notifyBlacklistUpdate();
      })
      .then(() => resolve({ filters: filterRecords }))
      .catch(reject);
  });
}

function removeBlacklist(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const termFilters = args && args.input && args.input.filters;
    if (!termFilters || !termFilters.length) return reject('No blacklists to remove specified.');

    const termIds = termFilters.map(termFilter => termFilter.id);

    const query = `
    DELETE
    FROM fortis.blacklist
    WHERE id IN ?
    `;

    const params = [
      limitForInClause(termIds)
    ];

    cassandraConnector.executeQuery(query, params)
      .then(() => {
        streamingController.notifyBlacklistUpdate();
      })
      .then(() => {
        resolve({
          filters: termFilters
        });
      })
      .catch(reject);
  });
}

module.exports = {
  removeSite: requiresRole(trackEvent(removeSite, 'removeSite'), 'admin'),
  modifyStreams: requiresRole(trackEvent(withRunTime(modifyStreams), 'modifyStreams', loggingClient.modifyStreamsExtraProps(), loggingClient.streamsExtraMetrics()), 'admin'),
  removeKeywords: requiresRole(trackEvent(withRunTime(removeKeywords), 'removeKeywords', loggingClient.removeKeywordsExtraProps(), loggingClient.keywordsExtraMetrics()), 'admin'),
  addKeywords: requiresRole(trackEvent(withRunTime(addKeywords), 'addKeywords', loggingClient.addKeywordsExtraProps(), loggingClient.keywordsExtraMetrics()), 'admin'),
  editSite: requiresRole(trackEvent(withRunTime(editSite), 'editSite'), 'admin'),
  modifyBlacklist: requiresRole(trackEvent(withRunTime(modifyBlacklist), 'modifyBlacklist'), 'admin'),
  removeBlacklist: requiresRole(trackEvent(withRunTime(removeBlacklist), 'removeBlacklist'), 'admin'),
  addTrustedSources: requiresRole(trackEvent(withRunTime(addTrustedSources), 'addTrustedSources', loggingClient.addTrustedSourcesExtraProps(), loggingClient.trustedSourcesExtraMetrics()), 'admin'),
  removeTrustedSources: requiresRole(trackEvent(withRunTime(removeTrustedSources), 'removeTrustedSources', loggingClient.removeTrustedSourcesExtraProps(), loggingClient.trustedSourcesExtraMetrics()), 'admin')
};
