'use strict';

const Promise = require('promise');
const azure = require('azure-sb'); 
const { trackEvent, trackDependency } = require('../appinsights/AppInsightsClient');
const loggingClient = require('../appinsights/LoggingClient');
const SERVICE_BUS_CONNECTION_STRING = process.env.FORTIS_SB_CONN_STR;

const SERVICE_BUS_CONFIG_QUEUE = process.env.FORTIS_SB_CONFIG_QUEUE || 'configuration';
const SERVICE_BUS_COMMAND_QUEUE = process.env.FORTIS_SB_COMMAND_QUEUE || 'command'; 

function restartPipeline() {
  return notifyUpdate(SERVICE_BUS_COMMAND_QUEUE, { 'dirty': 'streams' });
}

function restartStreaming() {
  return notifyUpdate(SERVICE_BUS_COMMAND_QUEUE, { 'dirty': 'streams' });
}

function notifyWatchlistUpdate() {
  return notifyUpdate(SERVICE_BUS_CONFIG_QUEUE, { 'dirty': 'watchlist' });
}

function notifyBlacklistUpdate() {
  return notifyUpdate(SERVICE_BUS_CONFIG_QUEUE, { 'dirty': 'blacklist' });
}

function notifySiteSettingsUpdate() {
  return notifyUpdate(SERVICE_BUS_CONFIG_QUEUE, { 'dirty': 'sitesettings' });
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
      client = azure.createServiceBusService(SERVICE_BUS_CONNECTION_STRING);
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
  restartPipeline: trackEvent(restartPipeline, 'restartPipeline', loggingClient.restartPipelineExtraProps()),
  restartStreaming: trackDependency(restartStreaming, 'ServiceBus', 'send'),
  notifyWatchlistUpdate: trackDependency(notifyWatchlistUpdate, 'ServiceBus', 'send'),
  notifyBlacklistUpdate: trackDependency(notifyBlacklistUpdate, 'ServiceBus', 'send'),
  notifySiteSettingsUpdate: trackDependency(notifySiteSettingsUpdate, 'ServiceBus', 'send')
};