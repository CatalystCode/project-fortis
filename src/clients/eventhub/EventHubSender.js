'use strict';

const EventHubClient = require('azure-event-hubs').Client;
const Promise = require('promise');

const eventHubConnectionString = process.env.PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING;
const eventHubPath = process.env.PUBLISH_EVENTS_EVENTHUB_PATH;
const eventHubPartition = process.env.PUBLISH_EVENTS_EVENTHUB_PARTITION;
const eventHubClient = EventHubClient.fromConnectionString(eventHubConnectionString, eventHubPath);

function sendMessages(messages) {
  return new Promise((resolve, reject) => {
    if (!messages || !messages.length) {
      reject('No messages to be sent');
      return;
    }

    let payloads;
    try {
      payloads = messages.map(message => ({contents: JSON.stringify(message)}));
    } catch (err) {
      reject(`Unable to create payloads for EventHub: ${err}`);
      return;
    }

    eventHubClient.open()
    .then(() => eventHubClient.createSender())
    .then(eventHubSender => {
      eventHubSender.on('errorReceived', err => reject(`Error talking to EventHub: ${err}`));
      Promise.all(payloads.map(payload => eventHubSender.send(payload, eventHubPartition)))
      .then(() => resolve([]))
      .catch((err) => reject(`Error sending EventHub message: ${err}`));
    });
  });
}

module.exports = {
  sendMessages: sendMessages
};