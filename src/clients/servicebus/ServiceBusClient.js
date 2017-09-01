'use strict';

const Promise = require('promise');
const azure = require('azure-sb'); 
const asyncEachLimit = require('async/eachLimit');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;
const SERVICE_BUS_CONNECTION_STRING = process.env.FORTIS_SB_CONN_STR;
const MAX_CONCURRENT_BATCHES = process.env.MAX_CONCURRENT_BATCHES || 50;

let client = azure.createServiceBusService(SERVICE_BUS_CONNECTION_STRING);

/**
 * @param {string} queue
 * @param {Array<string>} messages
 * @returns {Promise}
 */
function sendMessages(queue, messages) {
  return new Promise((resolve, reject) => {
    if (!client) return reject('Failed to create service bus service. No service bus connection string provided.');

    if (!messages || !messages.length) {
      return reject('No messages to be sent to service bus.');
    }

    asyncEachLimit(messages, MAX_CONCURRENT_BATCHES, (message, asyncCallback) => {
      try {
        message => ({ body: JSON.stringify(message) });
      } catch (exception) {
        asyncCallback(exception);
      }

      try {
        client.sendQueueMessage(queue, message, (error) => {
          if (error) asyncCallback(error);
          else asyncCallback();
        });
      } catch (exception) {
        asyncCallback(exception);
      }
    },
    (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

module.exports = {
  sendMessages: trackDependency(sendMessages, 'ServiceBus', 'send')
};