'use strict';

const Promise = require('promise');
const translatorService = require('../clients/translator/MsftTranslator');
const eventHubSender = require('../clients/eventhub/EventHubSender');

module.exports = {
  // ---------------------------------------------------------------------------------- mutations

  publishEvents(args, res){ // eslint-disable-line no-unused-vars
    return eventHubSender.sendMessages(args && args.input && args.input.messages);
  },

  // ------------------------------------------------------------------------------------ queries

  byBbox(args, res){ // eslint-disable-line no-unused-vars
  },

  byEdges(args, res){ // eslint-disable-line no-unused-vars
  },

  event(args, res){ // eslint-disable-line no-unused-vars
  },

  translate(args, res) { // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      translatorService.translate(args.sentence, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ translatedSentence: result.translatedSentence, originalSentence: args.sentence }))
            .catch(err => reject(err));
    });
  },

  translateWords(args, res) { // eslint-disable-line no-unused-vars
    return new Promise((resolve, reject) => {
      translatorService.translateSentenceArray(args.words, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ words: result.translatedSentence }))
            .catch(err => reject(err));
    });
  }
};