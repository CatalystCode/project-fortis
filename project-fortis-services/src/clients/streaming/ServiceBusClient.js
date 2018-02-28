'use strict';

const Promise = require('promise');
const azure = require('azure-sb');
const { trackDependency } = require('../appinsights/AppInsightsClient');

const {
  fortisSbConnStr
} = require('../../../config').serviceBus;

let client;

function sendQueueMessage(queue, serviceBusMessage) {
  return new Promise((resolve, reject) => {
    if (!client) {
      try {
        client = azure.createServiceBusService(fortisSbConnStr);
      } catch (exception) {
        return reject(exception);
      }
    }

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
  sendQueueMessage: trackDependency(sendQueueMessage, 'ServiceBus', 'send'),
};
