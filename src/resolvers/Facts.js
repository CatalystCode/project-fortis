'use strict';

let Promise = require('promise');
let blobStorageManager = require('../storageClients/BlobStorageFactsManager');

module.exports = {
    list(args, res) { // eslint-disable-line no-unused-vars
        const startTime = Date.now();


        let promise = new Promise((resolve, reject) => {
            blobStorageManager.FetchFacts(args.pageSize, args.skip, args.tagFilter, (results, error) => {

                if (error) {
                    reject(`Error occured retrieving facts. [${error}]`);
                } else {
                    let facts = { 'type': 'FactCollection', facts: results, runTime: Date.now() - startTime };
                    resolve(facts);
                }
            });
        }, console.log);

        return promise;
    },

    get(args, res) { // eslint-disable-line no-unused-vars
        let promise = new Promise((resolve, reject) => {
            blobStorageManager.GetFact(args.id, (result, error) => {
                if (error) {
                    reject(`Error occured retrieving facts. [${error}]`);
                } else {
                    resolve(result);
                }
            });
        }, console.log);

        return promise;
    }
};