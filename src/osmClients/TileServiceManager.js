'use strict';

let azureTableService = require('../storageClients/AzureTableStorageManager');
let nconf = require('nconf');
let memoryStore = new nconf.Memory();
let request = require('request');
let async = require('async');
let turfInside = require('turf-inside');
let turfBbox = require('turf-bbox-polygon');
let geotile = require('geotile');

const PARALLELISM_LIMIT = 50;
const TILE_SERVICE = 'http://tile.mapzen.com/mapzen/vector/v1/places';
const VALID_PLACE_KINDS = ['neighbourhood', 'hamlet', 'suburb', 'locality', 'town', 'village', 'city', 'county', 'district', 'Populated place'];

const FetchSiteDefintion = (siteId, callback) => {
    let siteDefinition = memoryStore.get(siteId);
    if(siteDefinition){
        return callback(undefined, siteDefinition);
    }else{
        azureTableService.GetSiteDefinition(siteId, (error, siteList) => {
            if(!error && siteList && siteList.length > 0){
                siteDefinition = siteList[0].properties;
                memoryStore.set(siteId, siteDefinition);
                callback(undefined, siteDefinition);
            }else{
                const errorMsg = `There was an [${error}] error retreiving the site definition for site [${siteId}]`;
                console.error(errorMsg);
                callback(errorMsg, undefined);
            }
        });
    }
};

function PointFeatureInsideBBox(coordinatePair, bboxPolygon){
    const pointGeoJson = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': coordinatePair
        }
    };

    return turfInside(pointGeoJson, bboxPolygon);
}

function InvokeServiceRequest(url, callback, featureCollection, bboxPolygon){
    const GET = {
        url: url,
        json: true,
        withCredentials: false
    };

    request(GET, (error, response, body) => {
        if(!error && response.statusCode === 200 && body) {
            if(body.features && Array.isArray(body.features)){
                body.features.forEach(feature => {
                    const featureType = feature.properties.kind;
                    const coordinates = feature.geometry.coordinates;
                    if(featureType && PointFeatureInsideBBox(coordinates, bboxPolygon) 
                                               && VALID_PLACE_KINDS.indexOf(featureType) > -1){
                        const population = feature.properties.population;
                        const placeName = feature.properties['name:en'] || feature.properties.name;
                        const placeNameAr = feature.properties['name:ar'] || placeName;
                        const placeNameUr = feature.properties['name:ur'] || placeName;
                        const placeNameId = feature.properties['name:id'] || placeName;
                        const placeNameDe = feature.properties['name:de'] || placeName;
                        const id = feature.properties.id;
                        const urlPart = url.split('/');
                        const tileZ = urlPart[5];
                        const tileX = urlPart[6];
                        const tileY = urlPart[7].split('.')[0];

                        if(id && placeName && feature.geometry.type === 'Point'){
                            featureCollection.set(placeName, Object.assign({}, {
                                coordinates: coordinates, id: id, source: feature.properties.source, 
                                name: placeName, name_ur: placeNameUr, name_id: placeNameId, name_ar: placeNameAr, name_de: placeNameDe, kind: feature.properties.kind,
                                population: population, tileId: `${tileZ}_${tileY}_${tileX}`
                            }));
                        }
                    }
                });
            }
        }else{
            const errMsg = `[${error}] occured while fetching request for url ${url}`;
            console.error(errMsg);
            callback(errMsg);

            return;
        }

        callback();
    });
}

module.exports = {
    FetchTilesInsideBbox: function(siteId, bbox, zoomLevel, minPopulation, maxPopulation, callback){
        if(siteId && bbox && bbox.length === 4){
            FetchSiteDefintion(siteId, (error, siteDefinition) => {
                if(!error){
                    const mapzenApiKey = siteDefinition.mapzenApiKey;
                    const tileBbox = {north:bbox[3], west: bbox[0], east: bbox[2], south: bbox[1]};
                    const tileIds = geotile.tileIdsForBoundingBox(tileBbox, zoomLevel);
                    const bboxPolygon = turfBbox(bbox);
                    const serviceCalls = tileIds.map(tileId => {
                        const tilePart = tileId.split('_');

                        return `${TILE_SERVICE}/${tilePart[0]}/${tilePart[2]}/${tilePart[1]}.json?api_key=${mapzenApiKey}`;
                    });

                    let featureCollection = new Map();

                    async.eachLimit(serviceCalls, PARALLELISM_LIMIT, (serviceCall, cb) => InvokeServiceRequest(serviceCall, cb, featureCollection, bboxPolygon), err=> {
                        
                        callback(err, Array.from(featureCollection.values()));
                    });
                }else{
                    callback(error, undefined);
                }
            });
        }else{
            const errMsg = 'invalid parameters';

            callback(errMsg, undefined);
        }
    }
};