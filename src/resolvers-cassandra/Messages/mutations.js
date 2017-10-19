'use strict';

const streamingController = require('../../clients/streaming/StreamingController');
const eventHubSender = require('../../clients/eventhub/EventHubSender');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;
const restartPipelineExtraProps = require('../../clients/appinsights/LoggingClient').restartPipelineExtraProps;

function restartPipeline(args, res) { // eslint-disable-line no-unused-vars
  return streamingController.restartPipeline();
}

function publishEvents(args, res) { // eslint-disable-line no-unused-vars
  return eventHubSender.sendMessages(args && args.input && args.input.messages);
}

module.exports = {
  restartPipeline: trackEvent(restartPipeline, 'restartPipeline', restartPipelineExtraProps()),
  publishEvents: trackEvent(publishEvents, 'publishEvents')
};
