'use strict';

const Promise = require('promise');
const azure = require('azure-sb'); 
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;
const SERVICE_BUS_CONNECTION_STRING = process.env.FORTIS_SB_CONN_STR;

let client = azure.createServiceBusService(SERVICE_BUS_CONNECTION_STRING);

/**
 * @param {string} queue
 * @param {string} message
 * @returns {Promise}
 */
function sendMessage(queue, message) {
  return new Promise((resolve, reject) => {
    if (!client) return reject('Failed to create service bus service. No service bus connection string provided.');

    if (!message || !message.length) {
      return reject('No message to be sent to service bus.');
    }

    try {
      message => ({ body: JSON.stringify(message) });
    } catch (exception) {
      return reject(exception);
    }

    try {
      client.sendQueueMessage(queue, message, (error) => {
        if (error) reject(error);
        else resolve(message);
      });
    } catch (exception) {
      reject(exception);
    }
  });
}

module.exports = {
  sendMessages: trackDependency(sendMessage, 'ServiceBus', 'send')
};