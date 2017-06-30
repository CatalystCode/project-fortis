'use strict';

const Promise = require('promise');
const translatorService = require('../clients/translator/MsftTranslator');
const eventHubSender = require('../clients/eventhub/EventHubSender');

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  /**
   * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, creadtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
   */

  /**
   * @param {{messages: Array<{RowKey: string, created_at: string, featureCollection: Array<{type: string, features: Array<{type: string, coordinates: number[]}>>, message: string, language: string, link: string, source: string, title: string}>}}} args
   * @returns {Promise.<string[]>}
   */
  publishEvents(args, res){ // eslint-disable-line no-unused-vars
    return eventHubSender.sendMessages(args && args.input && args.input.messages);
  },

  // ------------------------------------------------------------------------------------ queries

  /**
   * @param {site: string, originalSource: string, coordinates: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
   * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
   */
  byLocation(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {site: string, originalSource: string, bbox: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
   * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
   */
  byBbox(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {site: string, originalSource: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
   * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
   */
  byEdges(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{site: string, messageId: string, dataSources: string[], langCode: string}} args
   * @returns {Promise.<Feature>}
   */
  event(args, res){ // eslint-disable-line no-unused-vars
  },

  /**
   * @param {{sentence: string, fromLanguage: string, toLanguage: string}} args
   * @returns {Promise.<{originalSentence: string, translatedSentence: string}>}
   */
  translate(args, res) { // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      translatorService.translate(args.sentence, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ translatedSentence: result.translatedSentence, originalSentence: args.sentence }))
            .catch(err => reject(err));
    });
  },

  /**
   * @param {{words: string[], fromLanguage: string, toLanguage: string}} args
   * @returns {Promise.<{words: Array<{originalSentence: string, translatedSentence: string}>}>}
   */
  translateWords(args, res) { // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      translatorService.translateSentenceArray(args.words, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ words: result.translatedSentence }))
            .catch(err => reject(err));
    });
  }
};