'use strict';

let azure = require('azure-storage');
let Promise = require('promise');
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SKIP = 0;
const FACTS_CONTAINER_NAME = 'factsout';
const FACTS_STORAGE_CONNECTION_STRING = process.env.FACTS_STORAGE_CONNECTION_STRING;

module.exports = {

    GetFact: function (id, callback, logger) { // eslint-disable-line no-unused-vars
        var blobSvc = azure.createBlobService(FACTS_STORAGE_CONNECTION_STRING);
        let blobPrefix = id.split('-')[0] + '/' + id.split('-')[1] + '/' + id.split('-')[2];
        let factIndex = id.split('-')[3];
        blobSvc.listBlobsSegmentedWithPrefix(FACTS_CONTAINER_NAME, blobPrefix, null, null, (error, result, response) => { // eslint-disable-line no-unused-vars
            if (error || !result || !result.entries || result.entries.length == 0) {
                callback(null, error);
            }
            else {
                let blobName = result.entries[0].name;
                blobSvc.getBlobToText(FACTS_CONTAINER_NAME, blobName, null, function (error, text) {
                    if (error) {
                        callback(null, error);
                    }
                    else {
                        try {
                            let rawFact = JSON.parse(text.split('\n')[factIndex]);
                            callback(getFactObject(rawFact, blobName, factIndex));
                        }
                        catch (e) {
                            callback(null, e);
                        }
                    }
                });
            }
        });
    },

    FetchFacts: function (pageSize, skip, tagFilter, callback, logger) {
        pageSize = pageSize || DEFAULT_PAGE_SIZE;
        skip = skip || DEFAULT_SKIP;

        var blobSvc = azure.createBlobService(FACTS_STORAGE_CONNECTION_STRING);
        new Promise((resolve, reject) => {
            blobSvc.listBlobsSegmented(FACTS_CONTAINER_NAME, null, (error, result, response) => { // eslint-disable-line no-unused-vars
                if (!error) {
                    let blobs = result.entries.filter(blob => {
                        return blob.name.indexOf('.json') != -1 && blob.lastModified;
                    }).sort(function (a, b) {
                        return Date.parse(getDateFromBlobName(a.name)) < Date.parse(getDateFromBlobName(b.name)) ? 1 : -1;
                    }).slice(skip, skip + pageSize);
                    resolve(blobs);
                }
                else {
                    console.log(`error [${error}]`);
                    reject(error);
                }
            });
        }).then(blobs => {
            Promise.all(getReadBlobPromises(blobs, tagFilter)).then(facts => {
                var result = facts.filter(fact => fact).sort(function (a, b) {
                    return a.id < b.id ? 1 : -1;
                }).slice(0, pageSize);
                callback(result);
            });
        }).catch(error => callback(null, error));


        function getReadBlobPromises(blobs, tagFilter) {
            var blobReadPromises = [];
            blobs.forEach(blob => {
                blobReadPromises.push(new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                    blobSvc.getBlobToText(FACTS_CONTAINER_NAME, blob.name, null, function (error, text) {
                        let factIndex = 0;
                        text.split('\n').forEach(factText => {
                            try {
                                let rawFact = JSON.parse(factText);
                                if (tagFilter && tagFilter.length != 0 && !tagsMatchFilter(tagFilter, rawFact.tags)) {
                                    resolve();
                                }
                                else {
                                    factIndex++;
                                    console.log(getFactObject(rawFact, blob.name));
                                    resolve(getFactObject(rawFact, blob.name, factIndex));
                                }

                            }
                            catch (e) {
                                if (logger) logger(e);
                                resolve();
                            }

                        });
                    });
                }));
            });
            return blobReadPromises;
        }
    }
};

function getDateFromBlobName(name) {
    return name.split('/')[0] + '-' + name.split('/')[1] + '-' + name.split('/')[2];
}

function tagsMatchFilter(tagFilter, factTags) {
    return factTags.filter(factTag => tagFilter.indexOf(factTag) != -1).length != 0;
}

function getFactObject(rawFact, blobName, factIndex) {
    return {
        id: getDateFromBlobName(blobName) + '-' + factIndex,
        language: rawFact.language,
        title: rawFact.title,
        tags: rawFact.tags,
        date: getDateFromBlobName(blobName),
        sources: rawFact.sources,
        text: rawFact.text,
        link: rawFact.link
    };
}
