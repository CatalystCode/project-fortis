'use strict';
let asyncEachLimit = require('async/eachLimit');

/** http://docs.datastax.com/en/developer/nodejs-driver/3.2/features/batch/
 * TODO: ASYNC_BATCH_LIMIT will need to be tuned.
 * It is best to keep the batch size small (in the order of 10s).
 * If the batch size is greater than 5k, then the server will issue a warning.
 */
const ASYNC_BATCH_LIMIT = 10;

module.exports = {

  /** Used to execute multiple INSERT, UPDATE, or DELETE statements
   * @param Client client - The cassandra client
   * @param Array<{query, params}> mutations - cassandra prepared statements 
   */
  batch: (client, mutations, callback) => {
    asyncEachLimit(mutations, ASYNC_BATCH_LIMIT, (mutationsIteratee, asyncCB) => processMutation(client, mutationsIteratee, asyncCB),
      finalCBErr => {
        if(finalCBErr){
          console.error(`Error occured publishing events: ${JSON.stringify(finalCBErr)}`);
        }else{
          console.log('Finished executing cassandra prepared statements');
        }
        callback(finalCBErr);
      }
    );
  }

};

let processMutation = (client, mutationsIteratee, asyncCB) => {
  client.batch(mutationsIteratee, { prepare: true }, function(err) {
    if(err) {
      asyncCB(err);
    } else {
      asyncCB();
    }
  });
};