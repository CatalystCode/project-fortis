'use strict';

const EventHubClient = require('azure-event-hubs').Client;
const Promise = require('promise');
const trackDependency = require('../appinsights/AppInsightsClient').trackDependency;

const {
  publishEventsEventhubConnectionString, publishEventsEventhubPath,
  publishEventsEventhubPartition
} = require('../../../config').eventHub;

function sendMessages(messages) {
  return new Promise((resolve, reject) => {
    if (!messages || !messages.length) {
      return reject('No messages to be sent');
    }

    let payloads;
    try {
      payloads = messages.map(message => ({contents: JSON.stringify(message)}));
    } catch (err) {
      return reject(`Unable to create payloads for EventHub: ${err}`);
    }

    const eventHubClient = EventHubClient.fromConnectionString(
      publishEventsEventhubConnectionString, publishEventsEventhubPath);

    if (!eventHubClient) return reject('No event hub connection string provided.');

    eventHubClient.open()
      .then(() => eventHubClient.createSender())
      .then(eventHubSender => {
        eventHubSender.on('errorReceived', err => reject(`Error talking to EventHub: ${err}`));
        Promise.all(payloads.map(payload => eventHubSender.send(payload, publishEventsEventhubPartition)))
          .then(() => resolve([]))
          .catch((err) => reject(`Error sending EventHub message: ${err}`));
      });
  });
}

module.exports = {
  sendMessages: trackDependency(sendMessages, 'EventHub', 'send')
};