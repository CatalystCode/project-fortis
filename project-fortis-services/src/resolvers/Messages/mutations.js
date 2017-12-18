'use strict';

const streamingController = require('../../clients/streaming/StreamingController');
const eventHubSender = require('../../clients/eventhub/EventHubSender');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;
const restartPipelineExtraProps = require('../../clients/appinsights/LoggingClient').restartPipelineExtraProps;
const { requiresRole } = require('../shared');

function restartPipeline(args, res) { // eslint-disable-line no-unused-vars
  return streamingController.restartPipeline();
}

function publishEvents(args, res) { // eslint-disable-line no-unused-vars
  return eventHubSender.sendMessages(args && args.input && args.input.messages);
}

module.exports = {
  restartPipeline: requiresRole(trackEvent(restartPipeline, 'restartPipeline', restartPipelineExtraProps()), 'admin'),
  publishEvents: requiresRole(trackEvent(publishEvents, 'publishEvents'), 'admin')
};
