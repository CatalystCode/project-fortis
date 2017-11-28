'use strict';

const azure = require('azure-storage');
const moment = require('moment');
const asyncEachLimit = require('async/eachLimit');
const TextBase64QueueMessageEncoder = require('azure-storage').QueueMessageEncoder.TextBase64QueueMessageEncoder;

const PRE_NLP_QUEUE = process.env.PRE_NLP_QUEUE;
const DATE_FORMAT = 'MM/DD/YYYY HH:mm';
const ASYNC_QUEUE_LIMIT = 50;

function getAzureQueueService(){
  let queueSvc = azure.createQueueService();
  queueSvc.messageEncoder = new TextBase64QueueMessageEncoder();
  queueSvc.createQueueIfNotExists(PRE_NLP_QUEUE, (error, result, response) => { // eslint-disable-line no-unused-vars
    if (error) {
      RaiseException(`Unable to create new azure queue ${PRE_NLP_QUEUE}`);
    }
  });

  return queueSvc;
}

function RaiseException(errorMsg) {
  console.error('error occured: ' + errorMsg);
}

function pushMessageToStorageQueue(message, queueSvc, callback){
  try {
    queueSvc.createMessage(PRE_NLP_QUEUE, JSON.stringify(message), (error, result, response) => { // eslint-disable-line no-unused-vars
      if (error) {
        const errMsg = `Azure Queue push error occured error [${error}]`;
        RaiseException(errMsg);
        callback(errMsg);
      }else{
        console.log(`Wrote ${JSON.stringify(message)} to output queue.`);
        callback();
      }
    });
  } catch (error) {
    RaiseException(`Issue with pushing message ${JSON.stringify(message)} to out queue.`);
    return callback(error);
  }
}

function processMessage(item, queueSvc, asyncCB){
  let eventDate;

  try{
    eventDate = moment(item.created_at, DATE_FORMAT, 'en').toISOString();
  }catch(error){
    let errMsg = `Failed parsing published event date for event ${JSON.stringify(item)}`;
    RaiseException(errMsg);
    asyncCB(errMsg);
    return;
  }

  let message = {
    'source': 'custom',
    'created_at': eventDate,
    'lang': item.language,
    'message': {
      'id': item.RowKey,
      'geo': item.featureCollection,
      'message': item.message,
      'link': item.link,
      'originalSources': [item.source],
      'title': item.title
    }
  };

  pushMessageToStorageQueue(message, queueSvc, asyncCB);
}

module.exports = {
  customEvents(eventList, callback){
    let queueSvc = getAzureQueueService();
    if(eventList){
      asyncEachLimit(eventList, ASYNC_QUEUE_LIMIT, (item, asyncCB)=>processMessage(item, queueSvc, asyncCB),
                               finalCBErr => {
                                 let processedEvents;

                                 if(finalCBErr){
                                   console.error(`Error occured publishing events: ${JSON.stringify(finalCBErr)}`);
                                 }else{
                                   console.log(`Finished writing ${eventList.length} to ${PRE_NLP_QUEUE}`);
                                   processedEvents = eventList.map(ev=>ev.RowKey);
                                 }

                                 callback(finalCBErr, processedEvents);
                               }
            );
    }
  }
};