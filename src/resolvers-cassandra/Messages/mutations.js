'use strict';

const eventHubSender = require('../clients/eventhub/EventHubSender');

/**
 * @param {{messages: Array<{RowKey: string, created_at: string, featureCollection: Array<{type: string, features: Array<{type: string, coordinates: number[]}>>, message: string, language: string, link: string, source: string, title: string}>}}} args
 * @returns {Promise.<string[]>}
 */
function publishEvents(args, res) { // eslint-disable-line no-unused-vars
  return eventHubSender.sendMessages(args && args.input && args.input.messages);
}

module.exports = {
  publishEvents: publishEvents
};
