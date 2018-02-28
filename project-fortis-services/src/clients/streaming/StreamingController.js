'use strict';

const Promise = require('promise');
const azure = require('azure-sb');
const { trackDependency } = require('../appinsights/AppInsightsClient');

const {
  fortisSbConnStr, fortisSbCommandQueue, fortisSbConfigQueue
} = require('../../../config').serviceBus;

function restartPipeline() {
  return notifyUpdate(fortisSbCommandQueue);
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
  const serviceBusMessage = {};

  if (properties) serviceBusMessage.customProperties = properties;

  return sendQueueMessage(queue, serviceBusMessage);
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
  restartPipeline: trackDependency(restartPipeline, 'ServiceBus', 'sendRestartPipeline'),
  notifyWatchlistUpdate: trackDependency(notifyWatchlistUpdate, 'ServiceBus', 'sendWatchlistChanged'),
  notifyBlacklistUpdate: trackDependency(notifyBlacklistUpdate, 'ServiceBus', 'sendBlacklistChanged'),
  notifySiteSettingsUpdate: trackDependency(notifySiteSettingsUpdate, 'ServiceBus', 'sendSettingsChanged')
};