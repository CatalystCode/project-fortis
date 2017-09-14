'use strict';

const eventHubSender = require('../../clients/eventhub/EventHubSender');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

function publishEvents(args, res) { // eslint-disable-line no-unused-vars
  return eventHubSender.sendMessages(args && args.input && args.input.messages);
}

module.exports = {
  publishEvents: trackEvent(publishEvents, 'publishEvents')
};
