'use strict';

const { trackEvent } = require('../appinsights/AppInsightsClient');
const { sendQueueMessage } = require('./ServiceBusClient');

const {
  fortisSbCommandQueue, fortisSbConfigQueue
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

module.exports = {
  restartPipeline: trackEvent(restartPipeline, 'notifyRestartPipeline'),
  notifyWatchlistUpdate: trackEvent(notifyWatchlistUpdate, 'notifyWatchlistChanged'),
  notifyBlacklistUpdate: trackEvent(notifyBlacklistUpdate, 'notifyBlacklistChanged'),
  notifySiteSettingsUpdate: trackEvent(notifySiteSettingsUpdate, 'notifySettingsChanged')
};
