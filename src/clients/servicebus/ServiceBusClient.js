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
function sendStringMessage(queue, message) {
  return new Promise((resolve, reject) => {
    if (typeof message !== 'string') return reject('Message must be of type string.');
    if (!message || !message.length) {
      return reject('No message to be sent to service bus.');
    }

    if (!client) return reject('Failed to create service bus service. No service bus connection string provided.');
    const serviceBusMessage = { body: message };
    try {
      client.sendQueueMessage(queue, serviceBusMessage, (error) => {
        if (error) reject(error);
        else resolve(serviceBusMessage);
      });
    } catch (exception) {
      reject(exception);
    }
  });
}

module.exports = {
  sendMessages: trackDependency(sendStringMessage, 'ServiceBus', 'send')
};