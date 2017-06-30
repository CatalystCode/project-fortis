'use strict';

const asyncEachLimit = require('async/eachLimit');

/** http://docs.datastax.com/en/developer/nodejs-driver/3.2/features/batch/
 * TODO: ASYNC_BATCH_LIMIT will need to be tuned.
 * It is best to keep the batch size small (in the order of 10s).
 * If the batch size is greater than 5k, then the server will issue a warning.
 */
const ASYNC_BATCH_LIMIT = 10;

/** Used to execute multiple INSERT, UPDATE, or DELETE statements
 * @param {Client} client
 * @param {Array<{mutation: string, params: Array}>} mutations
 */
function batchMutations(client, mutations, callback) {
  asyncEachLimit(mutations, ASYNC_BATCH_LIMIT, (mutationBatch, asyncCB) => processMutation(client, mutationBatch, asyncCB),
    finalCBErr => {
      if(finalCBErr){
        console.log(`Error occured during the batch: ${JSON.stringify(finalCBErr)}`);
      }else{
        console.log('Finished executing cassandra prepared statements');
      }
      callback(finalCBErr, mutations);
    }
  );
}

function processMutation(client, mutationBatch, asyncCB) {
  /* cassandra client batches on arrays */
  if(!(mutationBatch instanceof Array)) mutationBatch = [mutationBatch];
  client.batch(mutationBatch, { prepare: true }, (err) => {
    if(err) {
      console.log(err, 'failed to process batch');
      asyncCB('Failed to process mutation batch');
    }
  });
}

module.exports = {
  batchMutations: batchMutations
};