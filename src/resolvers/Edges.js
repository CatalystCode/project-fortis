'use strict';

let Promise = require('promise');
let postgresMessageService = require('../postgresClients/PostgresLocationManager');
let azureTableService = require('../storageClients/AzureTableStorageManager');
let DEFAULT_LANGUAGE='en';

const DEFAULT_LIMIT = 5;
const DEFAULT_LAYER_TYPE = 'associations';
const DEFAULT_ZOOM_LEVEL = 15;

module.exports = {
    terms(args, res){
        const startTime = Date.now();
        let siteCode = args.site;
        let fromDate = args.fromDate;
        let sourceFilter = args.sourceFilter || ['tadaweb'];
        let toDate = args.toDate;

        return new Promise((resolve, reject) => {
            if(fromDate && toDate){
                postgresMessageService.FetchMessageTopicList(siteCode, sourceFilter, fromDate, toDate, 
                        (error, result) => {
                            if(error){
                                let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                                reject(errorMsg);
                            }else{
                                resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Location'}));
                            }
                        });
            }else{
                azureTableService.GetKeywordList(siteCode, 
                        (error, result) => {
                            if(error){
                                let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                                reject(errorMsg);
                            }else{
                                resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Term'}));
                            }
                        });
            }
        });
    },
    locations(args, res){
        const startTime = Date.now();
        let siteCode = args.site;

        return new Promise((resolve, reject) => {
            postgresMessageService.FetchAllLocations(siteCode, 
                        (error, result) => {
                            if(error){
                                let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                                reject(errorMsg);
                            }else{
                                resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Location'}));
                            }
                        });
        });
    },
    removeKeywords(args, res){
        const startTime = Date.now();
        const actionPost = args.input;
        const siteId = actionPost.site;
        const terms = actionPost.edges.map(term=>Object.assign({}, term, {PartitionKey: {'_': siteId}, RowKey: {'_': term.RowKey}}));
        
        return new Promise((resolve, reject) => {
            azureTableService.ModifyTermEntities(terms, siteId, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE, 
                    (error, result) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Term'}));
                        }
                    });
        });
    },
    addKeywords(args, res){
        const startTime = Date.now();
        const actionPost = args.input;
        const siteId = actionPost.site;
        const terms = actionPost.edges.map(term=>Object.assign({}, term, {PartitionKey: {'_': siteId}, RowKey: {'_': term.RowKey}}));

        return new Promise((resolve, reject) => {
            azureTableService.ModifyTermEntities(terms, siteId, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY, 
                    (error, result) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Term'}));
                        }
                    });
        });
    },
    saveLocations(args, res){
        const startTime = Date.now();
        const actionPost = args.input;
        const siteId = actionPost.site;
        const locations = actionPost.edges;

        return new Promise((resolve, reject) => {
            postgresMessageService.SaveLocalities(siteId, locations, 
                        (error, result) => {
                            if(error){
                                let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                                reject(errorMsg);
                            }else{
                                resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Location'}));
                            }
                        });
        });
    },
    removeLocations(args, res){
        const startTime = Date.now();
        const actionPost = args.input;
        const siteId = actionPost.site;
        const locations = actionPost.edges;
        
        return new Promise((resolve, reject) => {
            postgresMessageService.RemoveLocalities(siteId, locations, 
                    (error, result) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            resolve(Object.assign({}, {'runTime': Date.now() - startTime, 'edges': result, 'type': 'Location'}));
                        }
                    });
        });
    },
    popularLocations(args, res){
        const startTime = Date.now();

        let requestedLanguage = args.langCode || DEFAULT_LANGUAGE;
        let site = args.site;
        let timespan = args.timespan;
        let sourceFilter = args.sourceFilter;
        let fromDate = args.fromDate;
        let toDate = args.toDate;
        let limit = args.limit || DEFAULT_LIMIT;
        let zoom = args.zoomLevel || DEFAULT_ZOOM_LEVEL;
        let layertype = args.layertype || DEFAULT_LAYER_TYPE;

        return new Promise((resolve, reject) => {
            postgresMessageService.FetchPopularLocations(site, requestedLanguage, limit, timespan, zoom, layertype, sourceFilter, fromDate, toDate, 
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                        }
                    });
        });
    },
    timeSeries(args, res){
        const site = args.site;
        const fromDate = args.fromDate;
        const toDate = args.toDate;
        const limit = args.limit || DEFAULT_LIMIT;
        const zoom = args.zoomLevel || DEFAULT_ZOOM_LEVEL;
        const layertype = args.layertype || DEFAULT_LAYER_TYPE;
        const dataSource = args.sourceFilter;
        const mainEdge = args.mainEdge;

        return new Promise((resolve, reject) => {
            postgresMessageService.EdgeTimeSeries(site, limit, zoom, layertype, fromDate, toDate, mainEdge, dataSource, 
                    (error, results) => {
                        if(error || !(results.labels && results.graphData)){
                            let errorMsg = `Internal time series server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            resolve(results);
                        }
                    });
        });
    },
    
    topSources(args,res) {
        let fromDate = args.fromDate;
        let toDate = args.toDate;
        const site = args.site;
        const limit = args.limit;
        const sourceFilter = args.sourceFilter;
        const term = args.mainTerm;
        return new Promise((resolve, reject) => {
            postgresMessageService.FetchTopSources(site,fromDate,toDate,limit,term,sourceFilter,
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal top sources error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let collection = Object.assign({}, {sources: results});
                            resolve(collection);
                        }
                    });
        });
    }
};