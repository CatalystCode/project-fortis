'use strict';

const DEFAULT_LAYER_TYPE = 'associations';
const DEFAULT_ZOOM_LEVEL = 15;
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_LIMIT = 5;

let Promise = require('promise');
let postgresMessageService = require('../postgresClients/PostgresLocationManager');

module.exports = {
    popularLocations(args, res){
        const startTime = Date.now();

        let requestedLanguage = args.langCode || DEFAULT_LANGUAGE;
        let site = args.site;
        let timespan = args.timespan;
        let fromDate = args.fromDate;
        let toDate = args.toDate;
        let sourceFilter = args.sourceFilter;
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
    }
};