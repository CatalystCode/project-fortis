'use strict';

let azureTableService = require('../storageClients/AzureTableStorageManager');
let nconf = require('nconf');
let memoryStore = new nconf.Memory();
let moment = require('moment');
let async = require('async');
let pg = require('pg');
let PostgresService = require('postgres-client');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const PUSH_PARALLELISM = 50;
const MAX_RETRIES = 5;
const MIN_SEARCH_TERM_LENGTH = 4;
const ENGLISH_LANG_CODE = 'en';

const FetchSiteDefintion = (siteId, callback) => {
    let siteDefinition = memoryStore.get(siteId);
    if(siteDefinition){
        return callback(undefined, siteDefinition);
    }else{
        console.log(`Looking up site code for site [${siteId}]`);
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

const WritePostgresRecord = (stmt, client, callback) => {
    let successful = false;
    let attempts = 0;

    async.whilst(
        () => {
            return !successful && attempts < MAX_RETRIES;
        },
        pgCallback => {
            //console.log(stmt);
            client.query(stmt, (pgErr, results) => { // eslint-disable-line no-unused-vars
                attempts++;

                if (!pgErr){
                    successful = true;
                }else{
                    let errMsg = `error[${pgErr}] occurred writing the stmt to postgres`;
                    console.error(errMsg);
                }

                return pgCallback();
            });
        },
        callback
    );
};

const PostgresStmtBatch = (stmtList, siteId, callback) => {
    FetchSiteDefintion(siteId, (error, siteDefinition) => {
        if(!error && stmtList && stmtList.length > 0){
            const postgresClient = new pg.Client(siteDefinition.featuresConnectionString);
            postgresClient.connect(err => {
                console.log(`processing ${stmtList.length} record write operations`);
                if(!err){
                    async.eachLimit(stmtList, PUSH_PARALLELISM, (stmt, cb)=>WritePostgresRecord(stmt, postgresClient, cb), err=>callback(siteDefinition.supportedLanguages, postgresClient, err));
                }else{
                    const errMsg = 'An error occured obtaining a postgres connection';
                    callback(siteDefinition.supportedLanguages, postgresClient, errMsg);
                }
            });
        }else{
            const errMsg = `An error occured looking up the postgres connection string for site [${siteId}]`;
            console.error(errMsg);
            callback(undefined, undefined, errMsg);
        }
    });
};

function QueryLocalities(languages, pgClient, callback){
    const nameFieldNames = languages.map(lang => lang !== ENGLISH_LANG_CODE? `${lang}_name` : 'name');
    const query =  `select ${nameFieldNames}, population, region, alternatenames, aciiname, country_iso, originalsource, geonameid as rowkey, ST_X(geog::geometry) as longitude, ST_Y(geog::geometry) as latitude from localities order by name ASC`;

    pgClient.query(query, (error, results) => {
        if(!error){
            const locationsResponse = results.rows.map(location => {
                let mutatedLocation = {
                    'type': 'Location',
                    'name': location.name.toLowerCase(),
                    'name_ar': location.ar_name ? location.ar_name.toLowerCase() : '',
                    'name_ur': location.ur_name ? location.ur_name.toLowerCase() : '',
                    'name_id': location.id_name ? location.id_name.toLowerCase() : '',
                    'name_de': location.de_name ? location.de_name.toLowerCase() : '',
                    'coordinates': [location.longitude, location.latitude],
                    'population': location.population,
                    'alternatenames': location.alternatenames,
                    'country_iso': location.country_iso,
                    'aciiname': location.aciiname,
                    'originalsource': location.originalsource,
                    'region': location.region || '',
                    'RowKey': location.rowkey.toString()
                };

                nameFieldNames.forEach(nameFieldName => {
                    mutatedLocation[nameFieldName] = location[nameFieldName];
                });

                return mutatedLocation;
            });

            pgClient.end();
            callback(null, locationsResponse);
        }else{
            pgClient.end();
            callback(`response for locations request returned error [${error}]`, undefined);
        }
    });
}

function FetchPopularTerms(site, additionalEdge, limit, fromDate, toDate, zoomLevel, layertype, sourceFilter, callback){
    if(fromDate && toDate){
        let query;

        if(additionalEdge){
            query = `SELECT * FROM
                            (SELECT keyword, sum(mentions) as mentions, CASE WHEN keyword IN('${additionalEdge}') THEN 1 ELSE 0 END as defaultOrder
                             FROM tiles
                             WHERE mentions > 0 and zoom = ${zoomLevel}
                               and periodtype='hour' and perioddate between '${fromDate}' and '${toDate}'
                               and layertype = '${layertype}' and keyword is not null and layer = 'none'
                               ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                             GROUP BY keyword
                            ) a
                          ORDER BY defaultOrder DESC, mentions desc
                          LIMIT ${limit + 1}`;
        }else{
            query = `SELECT keyword, sum(mentions) as mentions
                          FROM tiles
                          WHERE mentions > 0 and zoom = ${zoomLevel}
                               and periodtype='hour' and perioddate between '${fromDate}' and '${toDate}'
                               and layertype = '${layertype}' and keyword is not null and layer = 'none'
                               ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                             GROUP BY keyword
                          ORDER BY mentions desc
                          LIMIT ${limit}`;
        }

        console.log(query);
        FetchSiteDefintion(site, (error, siteDefinition) => {
            if(!error){
                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if(!error){


                        let response = {
                            'edges': results.rows.map(item => Object.assign({}, {
                                'name': item.keyword,
                                'mentions': parseInt(item.mentions)
                            }))
                        };

                        callback(null, response, siteDefinition.featuresConnectionString);
                    }else{
                        callback(`response for popular terms returned error [${error}]`, undefined, undefined);
                    }
                });
            }
        });
    }
}

function TilesFetchInnerQueryUnfiltered(keyword, selectClause, whereClause){
    let innerQuery = `SELECT ${selectClause}, layer
                            FROM tiles
                            WHERE ${whereClause}
                                AND keyword = '${keyword}' and layer = 'none'`;

    return innerQuery;
}

function TilesFetchInnerQueryWithFilters(keyword, selectClause, whereClause, filteredEdges){
    let innerQuery = `SELECT ${selectClause}, layer as edge
                      FROM tiles
                      WHERE ${whereClause}
                         AND keyword = '${keyword}'
                         AND layer IN('${filteredEdges.join('\',\'')}')
                      UNION
                      SELECT ${selectClause}, keyword as edge
                      FROM tiles
                      WHERE ${whereClause}
                          AND layer = '${keyword}'
                          AND keyword IN('${filteredEdges.join('\',\'')}')`;

    return innerQuery;
}

module.exports = {
    FetchSentences: function(site, originalSource, bbox, locationCoords, mainTerm, fromDate, ToDate, limit, offset, filteredEdges,
                             language, sourceFilter, fulltextTerm, callback){
        let offsetValue = offset || DEFAULT_OFFSET;
        let limitValue = limit || DEFAULT_LIMIT;
        let radiusDistance = 3000;

        let query = ` SELECT st_asgeojson(geog) as featurecollection, array_to_json(keywords) as edges, array_to_json(original_sources) as original_sources_json,
                             to_char(createdtime, 'MM/DD/YYYY HH:MI:SS AM') as createdtime_fmt, *
                      FROM tilemessages
                      WHERE createdtime <= '${ToDate}' and createdtime >= '${fromDate}'
                        ${originalSource ? ` and original_sources = array['${originalSource}']` : ''}
                        ${bbox ? ` and ST_Intersects(geog, ST_MakeEnvelope(${bbox.join(', ')}, 4326))` : ''}
                        ${locationCoords && locationCoords.length === 2 ? ` and ST_DWithin(geog, ST_MakePoint(${locationCoords[0]}, ${locationCoords[1]}, 4326), ${radiusDistance})` : ''}
                        ${mainTerm && mainTerm.length > 0 ? ` and array['${mainTerm}'] && keywords`: ''}
                        ${sourceFilter && Array.isArray(sourceFilter) && sourceFilter.length > 0 ? ` and source IN('${sourceFilter.join('\',\'')}')` : ''}
                        ${fulltextTerm && fulltextTerm.length >= MIN_SEARCH_TERM_LENGTH ? ` and ${language}_sentence ~* '.*${fulltextTerm}.*'` : ''}
                        ${filteredEdges && Array.isArray(filteredEdges) && filteredEdges.length > 0 ? ` and keywords && array['${filteredEdges.join('\',\'')}']` : ''}
                      ORDER BY createdtime DESC
                        LIMIT ${limitValue} OFFSET ${offsetValue}
                    ;`;

        console.log(query);
        FetchSiteDefintion(site, (error, siteDefinition) => {
            if(!error){
                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if(!error){

                        let sentencesResponse = {
                            'type': 'FeatureCollection',
                            'bbox': bbox,
                            'features': results.rows.map(item => Object.assign({}, JSON.parse(item.featurecollection), {
                                'properties': {
                                    'messageid':item.messageid,
                                    'source':item.source,
                                    'edges': item.edges,
                                    'sentence': item[language+'_sentence']  || item[item.orig_language+'_sentence'],
                                    'language': item[language+'_sentence'] ? language : item.orig_language,
                                    'orig_language': item.orig_language,
                                    'sentiment': item.neg_sentiment,
                                    'createdtime': item.createdtime_fmt,
                                    'fullText': item.full_text && item.full_text !== '' ? item.full_text : item[language+'_sentence']  || item[item.orig_language+'_sentence'],
                                    'properties': {
                                        'title': item.title || '',
                                        'link': item.link || '',
                                        'originalSources': item.original_sources_json && Array.isArray(item.original_sources_json) ? item.original_sources_json : [item.source]
                                    }
                                }
                            }))
                        };

                        callback(undefined, sentencesResponse);
                    }else{
                        callback(error, undefined);
                    }
                });
            }
        });
    },

    FetchEvent: function(site, messageId, sources, langCode, callback){
        let query = ` SELECT st_asgeojson(geog) as featurecollection, to_char(createdtime, 'MM/DD/YYYY HH:MI:SS AM') as createdtime_fmt,
                             array_to_json(keywords) as edges, array_to_json(original_sources) as original_sources_json, *
                      FROM tilemessages
                      WHERE messageid = '${messageId}' and source IN('${sources.join('\',\'')}')
                    ;`;

        FetchSiteDefintion(site, (error, siteDefinition) => {
            if(!error){
                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if(!error && results.rows.length > 0){
                        const feature = results.rows[0];
                        const eventResponse = Object.assign({}, JSON.parse(feature.featurecollection), {
                            'properties': {
                                'createdtime': feature.createdtime_fmt,
                                'sentiment': feature.neg_sentiment,
                                'messageid':feature.messageid,
                                'source':feature.source,
                                'edges': feature.edges,
                                'sentence': feature[langCode+'_sentence'] ? feature[langCode+'_sentence'] : feature[feature.orig_language+'_sentence'],
                                'language': feature[langCode+'_sentence'] ? langCode : feature.orig_language,
                                'fullText': feature.full_text && feature.full_text !== '' ? feature.full_text : feature[feature.orig_language+'_sentence']  || feature[feature.orig_language+'_sentence'],
                                'properties': {
                                    'title': feature.title || '',
                                    'link': feature.link || '',
                                    'originalSources': feature.original_sources_json && Array.isArray(feature.original_sources_json) ? feature.original_sources_json : [feature.source]
                                }
                            }
                        });

                        callback(undefined, eventResponse);
                    }else{
                        callback(error, undefined);
                    }
                });
            }
        });
    },

    FetchEdgesByTileIds: function(site, tileIds, timespan, layertype, sourceFilter, fromDate, toDate, callback){
        if(tileIds && timespan && layertype && tileIds.length > 0){
            let query = `SELECT SUM(mentions) as mentions, keyword as edge
                        FROM  tiles
                        WHERE mentions > 0 and layertype = '${layertype}'
                          ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                          and tileid IN('${tileIds.join('\',\'')}') and layer = 'none'
                          ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                        GROUP BY keyword`;

            console.log(query);
            FetchSiteDefintion(site, (error, siteDefinition) => {
                if(!error){
                    PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                        if(!error){
                            let response = {
                                'edges': results.rows.map(item => {
                                    return {
                                        'type': 'Term',
                                        'name': item.edge,
                                        'mentionCount': item.mentions
                                    };
                                })
                            };

                            callback(undefined, response);
                        }else{
                            callback(error, undefined);
                        }
                    });
                }
            });
        }else{
            callback('Invalid parameters were passed to FetchTermEdges Service', undefined);
        }
    },

    FetchEdgesByTerm: function(site, bbox, zoomLevel, keyword, timespan, layertype, sourceFilter, fromDate, toDate, callback){
        if(zoomLevel && keyword && timespan, bbox){
            let query = `SELECT SUM(mentions) as mentions, edge
                        FROM
                            (SELECT mentions, layer as edge
                            FROM tiles
                            WHERE mentions > 0 and layertype = '${layertype}'
                            and tiles.geog && ST_MakeEnvelope(${bbox.join(', ')}, 4326)
                            ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                            ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                            and zoom = ${zoomLevel} AND keyword = '${keyword}' AND layer NOT IN('none', '${keyword}')
                           UNION
                            SELECT mentions, keyword as edge
                            FROM tiles
                            WHERE mentions > 0 and layertype = '${layertype}'
                            ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                            and tiles.geog && ST_MakeEnvelope(${bbox.join(', ')}, 4326)
                            ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                            and zoom = ${zoomLevel} AND layer = '${keyword}' and keyword <> '${keyword}') a
                        GROUP BY edge`;

            FetchSiteDefintion(site, (error, siteDefinition) => {
                if(!error){
                    PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                        if(!error){
                            let response = {
                                'edges': results.rows.map(item => {
                                    return {
                                        'type': 'Term',
                                        'name': item.edge,
                                        'mentionCount': item.mentions
                                    };
                                })
                            };

                            callback(undefined, response);
                        }else{
                            callback(error, undefined);
                        }
                    });
                }
            });
        }else{
            callback('Invalid parameters were passed to FetchTermEdges Service', undefined);
        }
    },

    FetchTopSources: function (site, fromDate, toDate, limit, mainTerm, sourceFilter, callback) {
        //Removing these data sources as the original_sources was originally backfilled with these values when the field was introduced.
        const invalidDataSources = ['{facebook-messages}', '{facebook-comments}', '{twitter}', '{acled}', '{tadaweb}'];
        const query = ` select original_sources, count(*), source
                        from tilemessages where original_sources not in('${invalidDataSources.join('\',\'')}')
                            ${sourceFilter && sourceFilter.length > 0 ? ` and source IN('${sourceFilter.join('\',\'')}') ` : ''}
                            ${mainTerm && mainTerm.length > 0 ? ` and array['${mainTerm}'] && keywords`: ''}
                            and createdtime <= '${toDate}' and createdtime >= '${fromDate}'
                        group by original_sources, source
                        order by count DESC
                        limit ${limit};`;

        console.log(query);
        FetchSiteDefintion(site, (error, siteDefinition) => {
            if (!error) {
                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if (!error) {

                        const topSourcesResponse = results.rows.map(topSource => {
                            let topSourcesAnalytics = {
                                'Name': topSource.original_sources.toString(),
                                'Count': topSource.count,
                                'Source' : topSource.source
                            };

                            return topSourcesAnalytics;
                        });

                        callback(null, topSourcesResponse);
                    } else {
                        console.log(`response for top sources request returned error [${error}]`);
                        callback(`response for top sources request returned error [${error}]`, undefined);
                    }
                });
            }
            else {
                callback('Invalid parameter data provided.', undefined);
            }
        });
    },

    FetchFacebookAnalytics: function (site, days, callback) {
        const query = `select original_sources, count(*), max(createdtime) as datetimeoflastpost
from tilemessages where source in('facebook-comments', 'facebook-messages') and original_sources not in('{facebook-messages}', '{facebook-comments}')
and createdtime  between CURRENT_TIMESTAMP - '${days} day'::INTERVAL and CURRENT_TIMESTAMP
group by original_sources;`;

        FetchSiteDefintion(site, (error, siteDefinition) => {
            if (!error) {
                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if (!error) {

                        const analyticsResponse = results.rows.map(facebookPage => {
                            let facebookPageAnalytics = {
                                'Name': facebookPage.original_sources.toString(),
                                'Count': facebookPage.count,
                                'LastUpdated': facebookPage.datetimeoflastpost
                            };

                            return facebookPageAnalytics;
                        });

                        callback(null, analyticsResponse);
                    } else {
                        callback(`response for facebook page analytics request returned error [${error}]`, undefined);
                    }
                });
            }
            else {
                callback('Invalid parameter data provided.', undefined);
            }
        });
    },

    FetchMessageTopicList: function (site, sourceFilter, fromDate, toDate, callback) {
        FetchSiteDefintion(site, (error, siteDefinition) => {
            if (!error && fromDate && toDate) {
                const query = `SELECT DISTINCT unnest(keywords) as topics
                       FROM tilemessages
                       WHERE createdtime <= '${toDate}' and createdtime >= '${fromDate}'
                            ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}`;

                PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                    if (!error) {
                        const topicsResponse = results.rows.map(row => Object.assign({}, {'type': 'Term', 'name': row.topics, 'RowKey': row.topics}));
                        callback(null, topicsResponse);
                    } else {
                        callback(`response for facebook page analytics request returned error [${error}]`, undefined);
                    }
                });
            }
            else {
                callback('Invalid parameter data provided.', undefined);
            }
        });
    },

    FetchTilesByBbox: function(site, bbox, zoomLevel, layerFilter, keyword, timespan, layertype, sourceFilter, fromDate, toDate, callback)
    {
        let filteredEdges = layerFilter, unfiltered = false;
        if(filteredEdges && Array.isArray(filteredEdges) && filteredEdges.length > 0){
            filteredEdges = layerFilter.filter(term=>term !== keyword && term !== 'none');
        }else{
            unfiltered = true;
        }

        if(timespan){
            let whereClause = `mentions > 0 and layertype = '${layertype}'
                            ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                            ${bbox ? ` and tiles.geog && ST_MakeEnvelope(${bbox.join(', ')}, 4326)` : ''}
                            ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                            ${zoomLevel ? ` and zoom = ${zoomLevel}` : ''}`;


            let selectClause = 'geog, neg_sentiment, pos_sentiment, mentions, tileid';
            let query, innerQuery, fromClause;

            if(unfiltered){
                fromClause = TilesFetchInnerQueryUnfiltered(keyword, selectClause, whereClause);
            }else{
                fromClause = TilesFetchInnerQueryWithFilters(keyword, selectClause, whereClause, filteredEdges);
            }

            fromClause = `SELECT features.geog, tileid, SUM(mentions*pos_sentiment) as pos_wavg, sum(mentions) as mentions,
				                 SUM(mentions*neg_sentiment) as neg_wavg
                          FROM (${fromClause}) features
                          GROUP BY geog, tileid`;

            innerQuery = `SELECT geog, tileid, neg_wavg/mentions AS neg_wavg,
                                pos_wavg/mentions AS pos_wavg,
                                mentions as mentions
                          FROM (${fromClause}) features_agg`;

            query = `SELECT st_asgeojson(tiles.geog) as feature, tiles.*, population
                     FROM (SELECT (select l.name as location_name FROM localities as l ORDER BY a.geog <-> l.geog LIMIT 1), a.*
                           FROM (${innerQuery}) a) tiles, localities b
                     WHERE location_name = b.name`;

            console.log(query);

            FetchSiteDefintion(site, (error, siteDefinition) => {
                if(!error){
                    PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                        if(!error){
                            let tileResponse = {
                                'type': 'FeatureCollection',
                                'features': results.rows.map(item => Object.assign({}, JSON.parse(item.feature), {
                                    'properties': {
                                        'neg_sentiment':item.neg_sentiment || item.neg_wavg,
                                        'pos_sentiment':item.pos_sentiment || item.pos_wavg,
                                        'mentionCount': parseInt(item.mentions),
                                        'population': item.population,
                                        'location': item.location_name,
                                        'tileId': item.tileid
                                    }
                                }))
                            };


                            callback(undefined, tileResponse);
                        }else{
                            callback(error, undefined);
                        }
                    });
                }
            });
        }else{
            callback('Invalid parameter data provided.', undefined);
        }
    },

    FetchTilesByIds: function(site, tileIds, edgeFilters, timespan, layertype, sourceFilter, fromDate, toDate, callback)
    {
        if(timespan && tileIds && Array.isArray(tileIds) && tileIds.length > 0){
            let query, innerQuery, fromClause;

            fromClause = `SELECT geog, neg_sentiment, pos_sentiment, mentions, tileid, keyword as edge
					      FROM tiles
					      WHERE mentions > 0 and layertype = '${layertype}' and layer = 'none'
                            and tileid IN('${tileIds.join('\',\'')}')
                          ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                          ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                          ${edgeFilters.length === 0 ? ' and keyword is not null ': ` and keyword IN('${edgeFilters.join('\',\'')}')`}`;

            fromClause = `SELECT features.geog, tileid, SUM(mentions*pos_sentiment) as pos_wavg, sum(mentions) as mentions,
				                 SUM(mentions*neg_sentiment) as neg_wavg
                          FROM (${fromClause}) features
                          GROUP BY geog, tileid`;

            innerQuery = `SELECT geog, tileid, neg_wavg/mentions AS neg_wavg,
                                pos_wavg/mentions AS pos_wavg,
                                mentions as mentions
                          FROM (${fromClause}) features_agg`;

            query = `SELECT st_asgeojson(tiles.geog) as feature, population, tileId, location_name, neg_wavg, pos_wavg, mentions
                     FROM (SELECT (select l.name as location_name FROM localities as l ORDER BY a.geog <-> l.geog LIMIT 1), a.*
                           FROM (${innerQuery}) a) tiles, localities b
                     WHERE location_name = b.name`;

            FetchSiteDefintion(site, (error, siteDefinition) => {
                if(!error){
                    PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                        if(!error){
                            let tileResponse = {
                                'type': 'FeatureCollection',
                                'features': results.rows.map(item => Object.assign({}, JSON.parse(item.feature), {
                                    'properties': {
                                        'neg_sentiment':item.neg_sentiment || item.neg_wavg,
                                        'pos_sentiment':item.pos_sentiment || item.pos_wavg,
                                        'mentionCount': parseInt(item.mentions),
                                        'population': item.population,
                                        'location': item.location_name,
                                        'tileId': item.tileid
                                    }
                                }))
                            };


                            callback(undefined, tileResponse);
                        }else{
                            callback(error, undefined);
                        }
                    });
                }
            });
        }else{
            callback('Invalid parameter data provided.', undefined);
        }
    },

    FetchPopularLocations: function(site, langCode, limit, timespan, zoomLevel, layertype, sourceFilter, fromDate, toDate, callback){
        if(langCode && timespan){
            let nameFieldName = langCode !== ENGLISH_LANG_CODE ? `${langCode}_name` : 'name';

            let query = `SELECT  location_name, SUM(mentions) as mentions, ST_X(b.geog::geometry) as longitude, ST_Y(b.geog::geometry) as latitude, population
                         FROM
                            (SELECT (select l.${nameFieldName} as location_name FROM localities as l ORDER BY a.geog <-> l.geog LIMIT 1), a.*
                            FROM   (SELECT geog, tileid, sum(mentions) as mentions
                                FROM tiles
                                WHERE mentions > 0 and zoom = ${zoomLevel}
                                    ${fromDate && toDate ? ` AND perioddate between '${fromDate}' and '${toDate}' and periodtype='hour'` : ` and period = '${timespan}'`}
                                    and layertype = '${layertype}' and keyword is not null and layer = 'none'
                                    ${sourceFilter && sourceFilter.length > 0 ? ` AND source IN('${sourceFilter.join('\',\'')}')` : ''}
                                GROUP BY geog, tileid) a) locations,
                                localities b
                         WHERE locations.location_name = b.name
                         GROUP BY location_name, b.geog, population
                         ORDER BY mentions desc
                         LIMIT ${limit}`;
            console.log(query);
            FetchSiteDefintion(site, (error, siteDefinition) => {
                if(!error){
                    PostgresService(siteDefinition.featuresConnectionString, query, (error, results) => {
                        if(!error){
                            let locationsResponse = {
                                'edges': results.rows.map(item => Object.assign({}, {
                                    'name': item.location_name,
                                    'population': item.population,
                                    'coordinates': [item.longitude, item.latitude],
                                    'mentions': item.mentions
                                }))
                            };

                            callback(null, locationsResponse);
                        }else{
                            callback(`response for locations request returned error [${error}]`, undefined);
                        }
                    });
                }
            });
        }
    },

    FetchAllLocations: function(siteCode, callback){
        if(siteCode){
            FetchSiteDefintion(siteCode, (error, siteDefinition) => {
                if(!error){
                    const postgresClient = new pg.Client(siteDefinition.featuresConnectionString);
                    postgresClient.connect(err => {
                        if(!err){
                            QueryLocalities(siteDefinition.supportedLanguages, postgresClient, callback);
                        }else{
                            callback(error, undefined);
                        }
                    });
                }else{
                    const errMsg = `An error occured looking up the postgres connection for ${siteCode}`;
                    console.error(errMsg);
                    callback(errMsg, undefined);
                }
            });
        }
    },
    SaveLocalities: function(siteCode, modifiedLocations, callback){
        if(siteCode){
            const upsertStmts = modifiedLocations.map(location=>{
                return `INSERT INTO localities (
                            geonameid, originalsource, feature_class, name, region, alternatenames,
                            aciiname, country_iso, geog, adminid, population, ar_name, ur_name, id_name, de_name
                        ) VALUES (
                            ${parseInt(location.RowKey)},
                            '${location.originalsource}',
                            'PPL',
                            '${location.name ? location.name.replace(/\'/g, '\'\'') : ''}',
                            '${location.region ? location.region.replace(/\'/g, '\'\'') : ''}',
                            '${location.alternatenames ? location.alternatenames.replace(/\'/g, '\'\'') : ''}',
                            '${location.aciiname ? location.aciiname.replace(/\'/g, '\'\'') : ''}',
                            '${location.country_iso ? location.country_iso.replace(/\'/g, '\'\'') : ''}',
                            ST_SetSRID(ST_MakePoint(${location.coordinates[0]}, ${location.coordinates[1]}), 4326),
                            0,
                            ${location.population},
                            '${location.name_ar ? location.name_ar.replace(/\'/g, '\'\'') : ''}',
                            '${location.name_ur ? location.name_ur.replace(/\'/g, '\'\'') : ''}',
                            '${location.name_id ? location.name_id.replace(/\'/g, '\'\'') : ''}',
                            '${location.name_de ? location.name_de.replace(/\'/g, '\'\'') : ''}'
                        ) ON CONFLICT (geonameid, originalsource) DO UPDATE SET
                            name = '${location.name.replace(/\'/g, '\'\'')}',
                            adminid = 0,
                            feature_class = 'PPL',
                            region = '${location.region ? location.region.replace(/\'/g, '\'\'') : ''}',
                            aciiname = '${location.aciiname ? location.aciiname.replace(/\'/g, '\'\'') : ''}',
                            country_iso = '${location.country_iso ? location.country_iso.replace(/\'/g, '\'\'') : ''}',
                            alternatenames = '${location.alternatenames ? location.alternatenames.replace(/\'/g, '\'\'') : ''}',
                            population = ${location.population},
                            ar_name = '${location.name_ar ? location.name_ar.replace(/\'/g, '\'\'') : ''}',
                            ur_name = '${location.name_ur ? location.name_ur.replace(/\'/g, '\'\'') : ''}',
                            id_name = '${location.name_id ? location.name_id.replace(/\'/g, '\'\'') : ''}',
                            de_name = '${location.name_de ? location.name_de.replace(/\'/g, '\'\'') : ''}',
                            geog = ST_SetSRID(ST_MakePoint(${location.coordinates[0]}, ${location.coordinates[1]}), 4326)
                        ;`;
            });

            console.log(`Processing request for a ${upsertStmts.length}`);
            PostgresStmtBatch(upsertStmts, siteCode, (supportedLanguages, pgClient, error)=>{
                if(!error){
                    QueryLocalities(supportedLanguages, pgClient, callback);
                }else{
                    callback(error, undefined);
                }
            });
        }
    },
    RemoveLocalities: function(siteCode, modifiedLocations, callback){
        if(siteCode){
            const geonameIds = modifiedLocations.map(location=>parseInt(location.RowKey));
            const deleteStmt = `DELETE FROM localities where geonameid IN(${geonameIds.join(',')});`;

            console.log(deleteStmt);

            PostgresStmtBatch([deleteStmt], siteCode, (supportedLanguages, pgClient, error)=>{
                if(!error){
                    QueryLocalities(supportedLanguages, pgClient, callback);
                }else{
                    callback(error, undefined);
                }
            });
        }
    },
    EdgeTimeSeries: function(siteKey, limit, zoom, layertype, fromDate, toDate, selectedEdge, dataSource, callback){
        if(siteKey){
            FetchPopularTerms(siteKey, selectedEdge || undefined, limit, fromDate, toDate,
                              zoom, layertype, dataSource, (error, popularTerms, featureConnString) => {
                                  if(!error){
                                      const labels = popularTerms.edges;

                                      if(labels && labels.length > 0){
                                          const query = ` SELECT keyword, sum(mentions) as mentions, perioddate
                                        FROM tiles
                                        WHERE zoom = ${zoom} and keyword is not null and layer = 'none' and periodtype='hour'
                                            and perioddate between '${fromDate}' and '${toDate}'
                                            ${dataSource && dataSource.length > 0 ? ` AND source IN('${dataSource.join('\',\'')}')` : ''}
                                            and layertype = '${layertype}' and keyword in ('${labels.map(edge=>edge.name).join('\',\'')}')
                                        GROUP BY keyword, perioddate
                                        ORDER BY perioddate, keyword`;

                                          PostgresService(featureConnString, query, (error, results) => {
                                              if(!error){
                                                  let aggregateMap = new Map();
                                                  let timeSeriesEntry;

                                                  results.rows.forEach(item => {
                                                      const unixTime = moment(item.perioddate).valueOf();
                                                      timeSeriesEntry = aggregateMap.get(unixTime);
                                                      if(!timeSeriesEntry){
                                                          timeSeriesEntry = Object.assign({}, {date: new Date(unixTime), edges: [], mentions: []});
                                                          aggregateMap.set(unixTime, timeSeriesEntry);
                                                      }

                                                      timeSeriesEntry.edges.push(item.keyword);
                                                      timeSeriesEntry.mentions.push(item.mentions);
                                                  });

                                                  callback(null, {labels: labels, graphData: Array.from(aggregateMap.values())});
                                              }else{
                                                  callback(`response for locations request returned error [${error}]`, undefined);
                                              }
                                          });
                                      }else{
                                          callback(null, {labels: [], graphData: []});
                                      }
                                  }
                              });
        }
    }
};