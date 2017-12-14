'use strict';

const Promise = require('promise');
const azure = require('azure-sb'); 
const { trackDependency } = require('../appinsights/AppInsightsClient');

const {
  fortisSbConnStr, fortisSbCommandQueue, fortisSbConfigQueue
} = require('../../../config').serviceBus;

function restartPipeline() {
  return notifyUpdate(fortisSbCommandQueue, { 'dirty': 'streams' });
}

function restartStreaming() {
  return notifyUpdate(fortisSbCommandQueue, { 'dirty': 'streams' });
}

function notifyWatchlistUpdate() {
  return notifyUpdate(fortisSbConfigQueue, { 'dirty': 'watchlist' });
}

function notifyBlacklistUpdate() {
  return notifyUpdate(fortisSbConfigQueue, { 'dirty': 'blacklist' });
}

function notifySiteSettingsUpdate() {
  return notifyUpdate(fortisSbConfigQueue, { 'dirty': 'sitesettings' });
}

function notifyUpdate(queue, properties) {
  return new Promise((resolve, reject) => {
    const serviceBusMessage = { 
      customProperties: properties
    };

    sendQueueMessage(queue, serviceBusMessage)
      .then(resolve(true))
      .catch(reject(false));
  });
}

function sendQueueMessage(queue, serviceBusMessage) {
  return new Promise((resolve, reject) => {
    let client;
    try {
      client = azure.createServiceBusService(fortisSbConnStr);
    } catch (exception) {
      return reject(exception);
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
  restartPipeline: trackDependency(restartPipeline, 'ServiceBus', 'send'),
  restartStreaming: trackDependency(restartStreaming, 'ServiceBus', 'send'),
  notifyWatchlistUpdate: trackDependency(notifyWatchlistUpdate, 'ServiceBus', 'send'),
  notifyBlacklistUpdate: trackDependency(notifyBlacklistUpdate, 'ServiceBus', 'send'),
  notifySiteSettingsUpdate: trackDependency(notifySiteSettingsUpdate, 'ServiceBus', 'send')
};