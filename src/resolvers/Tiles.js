'use strict';

const DEFAULT_LAYER_TYPE = 'associations';
const DEFAULT_ZOOM_LEVEL = 15;
const DEFAULT_PLACE_ZOOM_LEVEL = 8;
const RADIUS_DISTANCE_IN_MILES = 5;

let Promise = require('promise');
let GeoPoint = require('geopoint');
let postgresMessageService = require('../postgresClients/PostgresLocationManager');
let tileService = require('../osmClients/TileServiceManager');
let geotile = require('geotile');

function CoordinatesToNearbyTiles(multiPointArray){
    let tileSet = new Set();

    multiPointArray.forEach(feature => {
        const radiusDistanceBbox = new GeoPoint(feature[1], feature[0]).boundingCoordinates(RADIUS_DISTANCE_IN_MILES);
        const tileBbox = {north:radiusDistanceBbox[1].latitude(), west: radiusDistanceBbox[0].longitude(), east: radiusDistanceBbox[1].longitude(), south: radiusDistanceBbox[0].latitude()};
        geotile.tileIdsForBoundingBox(tileBbox, DEFAULT_ZOOM_LEVEL).forEach(tile=>tileSet.add(tile));
    });

    return Array.from(tileSet);
}

module.exports = {
    fetchTilesByBBox(args, res){
        const startTime = Date.now();
        const filters = args.filteredEdges || [];
        const bbox = args.bbox;
        const layerType = args.layerType || DEFAULT_LAYER_TYPE;
        const mainTerm = args.mainEdge;
        const site = args.site;
        const timespan = args.timespan;
        const fromDate = args.fromDate;
        const toDate = args.toDate;
        const sourceFilter = args.sourceFilter;
        const zoom = args.zoomLevel || DEFAULT_ZOOM_LEVEL;

        return new Promise((resolve, reject) => {
            postgresMessageService.FetchTilesByBbox(site, bbox, zoom, filters, mainTerm, timespan, layerType, sourceFilter, fromDate, toDate, 
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                        }
                    });
        });
    },

    fetchTilesByLocations(args, res){
        const startTime = Date.now();
        const locations = args.locations;

        if(locations.length > 0){
            const tileIds = CoordinatesToNearbyTiles(locations);
            const filters = args.filteredEdges || [];
            const layerType = args.layerType || DEFAULT_LAYER_TYPE;
            const timespan = args.timespan;
            const fromDate = args.fromDate;
            const toDate = args.toDate;
            const site = args.site;
            const sourceFilter = args.sourceFilter;
            
            return new Promise((resolve, reject) => {
                postgresMessageService.FetchTilesByIds(site, tileIds, filters, timespan, layerType, sourceFilter, fromDate, toDate, 
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                        }
                    });
            });
        }else{
            throw new Error('Empty location list error');
        }
    },

    fetchPlacesByBBox(args, res){
        const startTime = Date.now();
        const bbox = args.bbox;

        if(bbox.length === 4){
            const zoom = args.zoom || DEFAULT_PLACE_ZOOM_LEVEL;
            const site = args.site;
            const populationMin = args.populationMin;
            const populationMax = args.populationMax;

            return new Promise((resolve, reject) => {
                tileService.FetchTilesInsideBbox(site, bbox, zoom, populationMin, populationMax, 
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let featureCollection = Object.assign({}, results, {bbox: bbox, type: 'FeatureCollection', runTime: Date.now() - startTime, features: results});
                            resolve(featureCollection);
                        }
                    });
            });
        }else{
            throw new Error('Empty bbox error');
        }
    },

    fetchEdgesByLocations(args, res){
        const startTime = Date.now();
        const locations = args.locations;

        if(locations.length > 0){
            const tileIds = CoordinatesToNearbyTiles(locations);
            const layerType = args.layerType || DEFAULT_LAYER_TYPE;
            const timespan = args.timespan;
            const fromDate = args.fromDate;
            const toDate = args.toDate;
            const site = args.site;
            const sourceFilter = args.sourceFilter;
            
            return new Promise((resolve, reject) => {
                postgresMessageService.FetchEdgesByTileIds(site, tileIds, timespan, layerType, sourceFilter, fromDate, toDate, 
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                        }
                    });
            });
        }else{
            throw new Error('Empty location list error');
        }
    },

    fetchEdgesByBBox(args, res){
        const startTime = Date.now();
        const layerType = args.layerType || DEFAULT_LAYER_TYPE;
        const timespan = args.timespan;
        const fromDate = args.fromDate;
        const toDate = args.toDate;        
        const bbox = args.bbox;
        const site = args.site;
        const zoom = args.zoomLevel || DEFAULT_ZOOM_LEVEL;
        const sourceFilter = args.sourceFilter;
        const mainTerm = args.mainEdge;
            
        return new Promise((resolve, reject) => {
            postgresMessageService.FetchEdgesByTerm(site, bbox, zoom, mainTerm, timespan, layerType, sourceFilter, fromDate, toDate,  
                    (error, results) => {
                        if(error){
                            let errorMsg = `Internal tile server error: [${JSON.stringify(error)}]`;
                            reject(errorMsg);
                        }else{
                            let messages = Object.assign({}, results, {runTime: Date.now() - startTime});
                            resolve(messages);
                        }
                    });
        });
    }
};