'use strict';

const EventHubClient = require('azure-event-hubs').Client;
const translatorService = require('../translatorClient/MsftTranslator');

const eventHubConnectionString = process.env.PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING;
const eventHubPath = process.env.PUBLISH_EVENTS_EVENTHUB_PATH;
const eventHubPartition = process.env.PUBLISH_EVENTS_EVENTHUB_PARTITION;
const eventHubClient = EventHubClient.fromConnectionString(eventHubConnectionString, eventHubPath);

module.exports = {
    // ---------------------------------------------------------------------------------- mutations

    publishEvents(args, res){ // eslint-disable-line no-unused-vars
        return new Promise((resolve, reject) => {
            const events = args && args.input && args.input.messages;
            if (!events) {
                reject(`No messages to be sent in request: ${JSON.stringify(args)}`);
            }

            let messages;
            try {
                messages = events.map(event => ({contents: JSON.stringify(event)}));
            } catch (err) {
                reject(`Unable to create payloads for EventHub: ${err}`);
            }

            eventHubClient.open()
            .then(() => eventHubClient.createSender())
            .then(eventHubSender => {
                eventHubSender.on('errorReceived', err => reject(`Error talking to EventHub: ${err}`));
                Promise.all(messages.map(message => eventHubSender.send(message, eventHubPartition)))
                .then(() => resolve([]))
                .catch((err) => reject(`Error sending EventHub message: ${err}`));
            });
        });
    },

    // ------------------------------------------------------------------------------------ queries

    byBbox(args, res){ // eslint-disable-line no-unused-vars
    },

    byEdges(args, res){ // eslint-disable-line no-unused-vars
    },

    event(args, res){ // eslint-disable-line no-unused-vars
    },

    translate(args, res) { // eslint-disable-line no-unused-vars
        return new Promise((resolve, reject) => {
            translatorService.translate(args.sentence, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ translatedSentence: result.translatedSentence, originalSentence: args.sentence }))
            .catch(err => reject(err));
        });
    },

    translateWords(args, res) { // eslint-disable-line no-unused-vars
        return new Promise((resolve, reject) => {
            translatorService.translateSentenceArray(args.words, args.fromLanguage, args.toLanguage)
            .then(result => resolve({ words: result.translatedSentence }))
            .catch(err => reject(err));
        });
    }
};