'use strict';

const Promise = require('promise');
const azureQueueManager = require('../clients/storage/AzureQueueManager');
const postgresMessageService = require('../clients/postgres/PostgresLocationManager');
const translatorService = require('../clients/translator/MsftTranslator');

const DEFAULT_LIMIT = 20;
const DEFAULT_LANGUAGE = 'en';

module.exports = {
  byBbox(args, res){ // eslint-disable-line no-unused-vars
    const startTime = Date.now();

    let requestedLanguage = args.langCode;
    let bbox = args.bbox;
    let site = args.site;
    let originalSource = args.originalSource;
    let filteredEdges = args.filteredEdges;
    let fromDate = args.fromDate || '11/5/2016';
    let toDate = args.toDate || '11/7/2016';
    let mainTerm = args.mainTerm;

    return new Promise((resolve, reject) => {
      postgresMessageService.FetchSentences(site, originalSource, bbox, undefined, mainTerm, fromDate, toDate, args.limit, args.offset,
                    filteredEdges, requestedLanguage, args.sourceFilter, args.fulltextTerm,
                        (error, results) => {
                          if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                          }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                          }
                        });
    });
  },
  byLocation(args, res){ // eslint-disable-line no-unused-vars
    const startTime = Date.now();

    let requestedLanguage = args.langCode;
    let originalSource = args.originalSource;
    let filteredEdges = args.filteredEdges;
    let coordinates = args.coordinates;
    let fromDate = args.fromDate;
    let toDate = args.toDate;
    let site = args.site;
    let limit = args.limit || DEFAULT_LIMIT;
    let offset = args.offset || 0;

    if(coordinates.length !== 2){
      throw new Error('Empty tileId error.');
    }

    return new Promise((resolve, reject) => {
      postgresMessageService.FetchSentences(site, originalSource, undefined, coordinates, undefined, fromDate, toDate, limit, offset,
                    filteredEdges, requestedLanguage, args.sourceFilter, args.fulltextTerm,
                        (error, results) => {
                          if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                          }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                          }
                        });
    });
  },
  byEdges(args, res){ // eslint-disable-line no-unused-vars
    const startTime = Date.now();

    let requestedLanguage = args.langCode;
    let filteredEdges = args.filteredEdges;
    let fromDate = args.fromDate;
    let toDate = args.toDate;
    let site = args.site;
    let originalSource = args.originalSource;
    let limit = args.limit || DEFAULT_LIMIT;
    let offset = args.offset || 0;

    return new Promise((resolve, reject) => {
      postgresMessageService.FetchSentences(site, originalSource, undefined, undefined, undefined, fromDate, toDate, limit, offset,
                    filteredEdges, requestedLanguage, args.sourceFilter, args.fulltextTerm,
                        (error, results) => {
                          if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                          }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                          }
                        });
    });
  },
  event(args, res){ // eslint-disable-line no-unused-vars
    const messageId = args.messageId;
    const site = args.site;
    const langCode = args.langCode || DEFAULT_LANGUAGE;
    const dataSources = args.dataSources;

    return new Promise((resolve, reject) => {
      postgresMessageService.FetchEvent(site, messageId, dataSources, langCode,
                        (error, results) => {
                          if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                          }else{
                            resolve(results);
                          }
                        });
    });
  },

  publishEvents(args, res){ // eslint-disable-line no-unused-vars
    const actionPost = args.input;
    const messages = actionPost.messages;

    return new Promise((resolve, reject) => {
      azureQueueManager.customEvents(messages,
                    (error, result) => {
                      if(error){
                        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                        reject(errorMsg);
                      }else{
                        resolve(result);
                      }
                    });
    });
  },

  translate(args, res) { // eslint-disable-line no-unused-vars
    let sentence = args.sentence;
    let fromLanguage = args.fromLanguage;
    let toLanguage = args.toLanguage;

    return new Promise((resolve, reject) => {
      translatorService.translate(sentence, fromLanguage, toLanguage).then( result => resolve({ translatedSentence: result.translatedSentence, originalSentence: sentence }), error => reject(error));
    });
  },

  translateWords(args, res) { // eslint-disable-line no-unused-vars
    let wordsToTranslate = args.words;
    let fromLanguage = args.fromLanguage;
    let toLanguage = args.toLanguage;

    return new Promise((resolve, reject) => {
      translatorService.translateSentenceArray(wordsToTranslate, fromLanguage, toLanguage).then( result => resolve({ words: result.translatedSentence }), error => reject(error));
    });
  }
};