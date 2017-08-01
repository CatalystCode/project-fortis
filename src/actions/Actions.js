import {SERVICES} from '../services/services';
import parallelAsync from 'async/parallel'
import { momentGetFromToRange, momentLastMonths } from '../utils/Utils.js';

const constants = {
           SENTIMENT_JSON_MAPPING : {
                "0": -5,
                "-1": -15,
                "1": 5
           },
           TIMESPAN_TYPES : {
                'hours': {
                    format: "MM/DD/YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'days': {
                    format: "MM/DD/YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'months': {
                    format: "YYYY-MM", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                },
                'weeks': {
                    format: "YYYY-WW", blobFormat: "[week]-YYYY-WW", rangeFormat: "isoweek"
                },
                'customDate': {
                    format: "MM/DD/YYYY", reactWidgetFormat: "MMM Do YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'customDateTime': {
                    format: "MM/DD/YY HH:00", reactWidgetFormat: "MMM Do YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'customMonth': {
                    format: "MMMM YYYY", reactWidgetFormat: "MMMM YYYY", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                }
           },
           DATA_SOURCES: new Map([["all", {"display": "All", "sourceValues":[], "icon": "fa fa-share-alt", "label": "All"}],
                            ["facebook", {"display": "Facebook", "sourceValues":["facebook-messages", "facebook-comments"], "icon": "fa fa-facebook-official", "label": ""}],
                            ["twitter", {"display": "Twitter", "sourceValues":["twitter"], "label": "", "icon": "fa fa-twitter"}],
                            ["acled", {"display": "acled", "sourceValues":["acled"], "label": "", "icon": "fa fa-font"}],
                            ["tadaweb", {"display": "Tadaweb", "sourceValues":["tadaweb"], "label": "", "icon": "fa fa-text-width"}],
                            ["custom", {"display": "Imported Events", "sourceValues":["custom"], "label": "", "icon": "fa fa-upload"}]
                          ]),
           MOMENT_FORMATS: {
               "timeScaleDate": "MM/DD/YY HH:00"
           },
           SENTIMENT_COLOR_MAPPING : {
               "negative": "red",
               "neutral": "yellow",
               "positive": "green"
           },
           EVENT_SOURCE_ICON_MAP : {
               "twitter": "fa fa-twitter",
               "facebook": "fa fa-facebook-official"
           },
           CATEGORY_KEY_MAPPING: {
             'kw': 'keyword',
             'g': 'group',
             'sec': 'sector',
             'st': 'status'
           },
           APP : {
               INITIALIZE: "APP:LOAD_SETTINGS",
               CHANGE_LANGUAGE: "APP:CHANGE_LANGUAGE",
           },
           DASHBOARD : {
               CHANGE_SEARCH: "SEARCH:CHANGE",
               INITIALIZE: "DASHBOARD:INIT",
               RELOAD_CHARTS: "RELOAD:RELOAD_CHARTS",
               RELOAD_TOP_SOURCES: "RELOAD:RELOAD_TOP_SOURCES",
               ASSOCIATED_TERMS: "UPDATE:ASSOCIATED_TERMS",
               RELOAD_SOURCES: "DASHBOARD:RELOAD_SOURCES",
               CHANGE_TERM_FILTERS: "UPDATE:CHANGE_TERM_FILTERS",
               CHANGE_LANGUAGE: "DASHBOARD:CHANGE_LANGUAGE",
               LOAD_DETAIL: "LOAD:DETAIL",
               LOAD_DETAIL_ERROR: "LOAD:DETAIL_ERROR",
               CHANGE_TERM_FILTERS_TO_ONLY: "UPDATE:CHANGE_TERM_FILTERS_TO_ONLY",
               CLEAR_FILTERS: "UPDATE:CLEAR_FILTERS",
           },
           FACTS : {
               LOAD_FACTS_SUCCESS: "LOAD:FACTS_SUCCESS",
               LOAD_FACTS_FAIL: "LOAD:FACTS_FAIL",
               LOAD_TAGS: "LOAD:TAGS",
               INITIALIZE: "FACTS:INIT",
               SAVE_PAGE_STATE: "SAVE:PAGE_STATE",
               CHANGE_LANGUAGE: "FACTS:CHANGE_LANGUAGE",
           },
           ADMIN : {
               LOAD_KEYWORDS: "LOAD:KEYWORDS",
               LOAD_SETTINGS: "LOAD:SETTINGS",
               LOAD_BLACKLIST: "LOAD:BLACKLIST",
               SAVE_SETTINGS: "SAVE:SETTINGS",
               LOAD_PLACES: "LOAD:PLACES",
               CREATE_SITE: "CREATE:SITE",
               SAVE_TWITTER_ACCTS: "SAVE:TWITTER_ACCTS",
               LOAD_TWITTER_ACCTS: "LOAD:TWITTER_ACCTS",
               SAVE_TRUSTED_TWITTER_ACCTS: "SAVE:TRUSTED_TWITTER_ACCTS",
               LOAD_TRUSTED_TWITTER_ACCTS: "LOAD:TRUSTED_TWITTER_ACCTS",
               LOAD_FB_PAGES: "LOAD:FB_PAGES",
               LOAD_LOCALITIES: "LOAD:LOCALITIES",
               PUBLISHED_EVENTS: "SAVE:EVENT_PUBLISH",
               LOAD_FAIL: "LOAD:FAIL",
           },
};

const EDGE_TYPE_ALL = "All";

const ResponseHandler = (error, response, body, callback) => {
    if(!error && response.statusCode === 200 && body.data && !body.errors) {
        callback(undefined, body.data);
    }else{
        const errMsg = `[${error}] occured while processing graphql request`;
        callback(errMsg, undefined);
    }
};

const DataSources = source => constants.DATA_SOURCES.has(source) ? constants.DATA_SOURCES.get(source).sourceValues : undefined;
const DataSourceLookup = requestedSource => {
    // eslint-disable-next-line
    for (let [source, value] of constants.DATA_SOURCES.entries()) {
        if(value.sourceValues.indexOf(requestedSource) > -1){
            return value;
        }
    }

    return undefined;
};

const MomentDateRangeFromTimespan = (timespanType, timespan) => {
    const formatter = constants.TIMESPAN_TYPES[timespanType];
    return momentGetFromToRange(timespan, formatter.format, formatter.rangeFormat);
}

const methods = {
    APP : {
        loadSettings(siteName){
            let self = this;
            SERVICES.getSiteDefintion(siteName, false, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                if (graphqlResponse && !error) {
                    self.dispatch(constants.APP.INITIALIZE, graphqlResponse.siteDefinition.sites[0]);
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            }));
        },
        changeLanguage(language){
           this.dispatch(constants.APP.CHANGE_LANGUAGE, language);
        }
    },
    DASHBOARD: {
        initializeDashboard(siteId) {
            let self = this;
            let dataStore = this.flux.stores.DataStore.dataStore;
            let dataSource = "all";
            let { fromDate, toDate } = MomentDateRangeFromTimespan(dataStore.timespanType, dataStore.datetimeSelection);

            parallelAsync({
                settings: callback => {
                        SERVICES.getSiteDefintion(siteId, false, (error, response, body) => ResponseHandler(error, response, body, callback))
                },
                trustedSources : callback => {
                        SERVICES.getTrustedTwitterAccounts(siteId, (err, response, body) => ResponseHandler(err, response, body, callback))
                },
                edges: callback => {
                        SERVICES.fetchEdges(siteId, EDGE_TYPE_ALL, (error, response, body) => ResponseHandler(error, response, body, callback))
                },
                chartData: callback => {
                        SERVICES.getChartVisualizationData(siteId, dataStore.datetimeSelection, dataStore.timespanType, undefined, undefined, undefined, 
                                                           dataSource, fromDate, toDate, dataStore.bbox, dataStore.zoomLevel, dataStore.originalSource,
                                                           (error, response, body) => ResponseHandler(error, response, body, callback))
                }
            }, (error, results) => {
                    if(!error && Object.keys(results).length === 4
                              && results.settings.siteDefinition.sites.length > 0){
                        const { settings, edges, chartData, trustedSources } = results;
                        const { timeSeries, locations } = chartData;

                        self.dispatch(constants.DASHBOARD.INITIALIZE, { settings, edges, timeSeries, locations, trustedSources, dataSource });
                    }else {
                        console.error(`[${error}] occured while fetching edges or site defintion for site [${siteId}]`);
                    }
            });
        },
        clearWatchlistFilters(){
            this.dispatch(constants.DASHBOARD.CLEAR_FILTERS, {});
        },
        reloadTopSources(topSources){
            this.dispatch(constants.DASHBOARD.RELOAD_TOP_SOURCES, topSources);
        },
        reloadVisualizationState(siteKey, datetimeSelection, timespanType, dataSource, selectedEntity, fromDateFilter, toDateFilter){
            let self = this;
            let fromDate, toDate;
            let dataStore = this.flux.stores.DataStore.dataStore;
            let unpopularSelectedTerm = dataStore.popularTerms.findIndex(term=>term.name===selectedEntity.name) === -1 ? selectedEntity.name : undefined;

            if(!fromDateFilter || !toDateFilter){
                const dates = MomentDateRangeFromTimespan(timespanType, datetimeSelection);
                fromDate = dates.fromDate;
                toDate = dates.toDate;
            }else{
                fromDate = fromDateFilter;
                toDate = toDateFilter;
            }

            SERVICES.getChartVisualizationData(siteKey, datetimeSelection, timespanType, selectedEntity, unpopularSelectedTerm,
                                               dataStore.categoryValue, dataSource, fromDate, toDate,
                                               dataStore.bbox, dataStore.zoomLevel, dataStore.originalSource,
                                               (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                    if(graphqlResponse) {
                        const {timeSeries, locations, topSources} = graphqlResponse;
                        self.dispatch(constants.DASHBOARD.RELOAD_CHARTS, { selectedEntity: selectedEntity,
                                                                           mutatedTimeSeries: timeSeries, 
                                                                           popularLocations: locations, 
                                                                           popularTerms: timeSeries.labels,
                                                                           dataSource: dataSource,
                                                                           timespanType: timespanType,
                                                                           topSources: topSources,
                                                                           datetimeSelection: datetimeSelection });
                    }else{
                        console.error(`[${error}] occured while processing tile visualization re-sync request`);
                    }
            }));
        },
        loadPopularSources(siteKey, datetimeSelection, timespanType, selectedTerm, dataSource){
           let formatter = constants.TIMESPAN_TYPES[timespanType];
           let dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
           let fromDate = dates.fromDate, toDate = dates.toDate;
           let self = this;

           SERVICES.getTopSourcesChartData(siteKey, datetimeSelection, selectedTerm, fromDate, toDate, dataSource, (err, response, body) => {
                if(response.statusCode === 200 && body && body.data) {
                    const {topSources} = body.data;
                    self.dispatch(constants.DASHBOARD.RELOAD_SOURCES, topSources);
                } else {
                    console.error(`[error occured while processing tile visualization re-sync request`);
                }
            });
        },
        changeTermsFilter(newFilters){
           this.dispatch(constants.DASHBOARD.CHANGE_TERM_FILTERS, newFilters);
        },
        changeTermsFilterToOnly(newFilter){
           this.dispatch(constants.DASHBOARD.CHANGE_TERM_FILTERS_TO_ONLY, newFilter);
        },
        updateAssociatedTerms(associatedKeywords, bbox, zoomLevel){
            this.dispatch(constants.DASHBOARD.ASSOCIATED_TERMS, {associatedKeywords, bbox, zoomLevel});
        },
        loadDetail(siteKey, messageId, dataSources, sourcePropeties){
            let self = this;
            SERVICES.FetchMessageDetail(siteKey, messageId, dataSources, sourcePropeties, (error, response, body) => {
                if (!error && response.statusCode === 200 && body.data) {
                    const data = body.data;
                    self.dispatch(constants.DASHBOARD.LOAD_DETAIL, data);
                } else {
                    console.error(`[${error}] occured while processing message request`);
                    self.dispatch(constants.DASHBOARD.LOAD_DETAIL_ERROR, error);
                }
            });
        },
        changeLanguage(language){
           this.dispatch(constants.DASHBOARD.CHANGE_LANGUAGE, language);
        }
    },
    FACTS: {
        load_facts(siteKey, limit, offset, filteredEdges = [], dataSources = [], fromDate="", toDate="", fulltextTerm="", langCode="en") {
            let self = this;
            let originalSource;
            if (dataSources.length === 0) dataSources = ["tadaweb"];
            let sourceProperties = ["title", "link", "originalSources"];
            if (!fromDate || !toDate) {
                let range = momentLastMonths(3);
                fromDate = range.fromDate;
                toDate = range.toDate;
            }

            SERVICES.FetchMessages(siteKey, originalSource, filteredEdges, langCode, limit, offset, fromDate, toDate, dataSources, fulltextTerm, sourceProperties, (err, reqRsp, body) => ResponseHandler(err, reqRsp, body, (error, response) => {
                if (response && !error) {
                    self.dispatch(constants.FACTS.LOAD_FACTS_SUCCESS, { response });
                } else {
                    console.warn('Error, could not load facts', error);
                    self.dispatch(constants.FACTS.LOAD_FACTS_FAIL, { error });
                }
            }));
        },
        load_tags(siteKey, sourceFilter=[], fromDate="", toDate="", query=""){
            let self = this;
            SERVICES.FetchTerms(siteKey, query, fromDate, toDate, sourceFilter, (err, response, body) => ResponseHandler(err, response, body, (error, response) => {
                if (response && !error) {
                    self.dispatch(constants.FACTS.LOAD_TAGS, response);
                } else {
                    console.error(`[${error}] occured while processing tag request`);
                }
            }));
        },
        load_settings(siteName){
            let self = this;
            SERVICES.getSiteDefintion(siteName, false, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                console.log(constants.FACTS.INITIALIZE);
                if (graphqlResponse && !error) {
                    self.dispatch(constants.FACTS.INITIALIZE, graphqlResponse.siteDefinition.sites[0]);
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            }));
        },
        save_page_state(pageState) {
            this.dispatch(constants.FACTS.SAVE_PAGE_STATE, pageState);
        },
        changeLanguage(language){
           this.dispatch(constants.FACTS.CHANGE_LANGUAGE, language);
        }
    },
    ADMIN: {
        load_settings: function(siteName){
            let self = this;
            const LOAD_SITE_LIST = true;

           SERVICES.getSiteDefintion(siteName, LOAD_SITE_LIST, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                    if(graphqlResponse) {
                        if(graphqlResponse.siteDefinition.sites.length > 0){
                            const action = false;
                            self.dispatch(constants.ADMIN.LOAD_SETTINGS, {settings: graphqlResponse.siteDefinition.sites[0],
                                                                          action: action,
                                                                          originalSiteName: siteName,
                                                                          siteList: graphqlResponse.siteList.sites});
                        }else{
                            console.error(`error [${error}] occured. site [${siteName}] does not exist.`);
                        }
                    }else{
                        console.error(`[${error}] occured while processing message request`);
                    }
            }));
        },
        save_settings: function(siteName, modifiedSettings){
            let self = this;

            SERVICES.createOrReplaceSite(siteName, modifiedSettings, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.createOrReplaceSite) {
                    const action = 'saved';
                    let mutatedSettings = Object.assign({}, {name: modifiedSettings.name}, {properties: modifiedSettings});
                    delete mutatedSettings.properties.name;

                    self.dispatch(constants.ADMIN.LOAD_SETTINGS, {settings: mutatedSettings,
                                                                  originalSiteName: siteName,
                                                                  action: action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        create_site: function(siteName, modifiedSettings){
            let self = this;

            SERVICES.createOrReplaceSite(siteName, modifiedSettings, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.createOrReplaceSite) {
                    const action = 'saved';
                    self.dispatch(constants.ADMIN.CREATE_SITE, {siteName, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_twitter_accts: function(siteName, twitterAccts){
            let self = this;
            const mutationNameTwitterAcctModify = "modifyTwitterAccounts";

            SERVICES.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModify, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                    const action = 'saved';
                    const streams = body.data.streams;
                    self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
           });
        },
        remove_twitter_accts: function(siteName, twitterAccts){
            let self = this;
            const mutationNameTwitterAcctModifyRemove = "removeTwitterAccounts";
            SERVICES.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModifyRemove, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                    const action = 'saved';
                    const streams = body.data.streams;
                    self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
           });
        },
        load_twitter_accts: function (siteId) {
            let self = this;
            SERVICES.getTwitterAccounts(siteId, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            const streams = body.data.streams;
                            let action = false;
                            self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                        }else{
                            let error = 'Error, could not load twitter accts for admin page';
                            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                        }
            });
        },
        load_keywords: function (siteId) {
            let self = this;
            const edgeType = "Term";
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.fetchEdges(siteId, edgeType, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            let response = body.data.terms ? body.data.terms.edges : [];

                            let action = false;
                            self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                        }else{
                            let error = 'Error, could not load keywords for admin page';
                            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                        }
                })
            }
        },
        remove_keywords: function(siteId, deletedRows){
            let self = this;

            SERVICES.removeKeywords(siteId, deletedRows, (error, response, body) => {
                if(!error && response.statusCode === 200 && body.data.removeKeywords) {
                    const response = body.data.removeKeywords.edges;
                    const action = 'saved';
                    self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_keywords: function(siteId, modifiedKeywords){
            let self = this;
            SERVICES.saveKeywords(siteId, modifiedKeywords, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const action = 'saved';
                    const response = body.data.addKeywords.edges;
                    self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                }else{
                    console.error(`[${error}] occured while processing message request`);
                }
            });
        },
        save_locations: function(siteId, modifiedLocations, mutatedSiteDefintion){
            parallelAsync({
                settings: callback => {
                        SERVICES.createOrReplaceSite(siteId, mutatedSiteDefintion, (error, response, body) => ResponseHandler(error, response, body, callback))
                },
                locations: callback => {
                        SERVICES.saveLocations(siteId, modifiedLocations, (error, response, body) => ResponseHandler(error, response, body, callback))
                }
            }, (error, results) => {
                    if(!error && Object.keys(results).length === 2
                              && results.settings.createOrReplaceSite.name){
                        const action = 'saved';
                        const response = results.locations.saveLocations.edges;
                        this.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action, mutatedSiteDefintion});
                    }else {
                        console.error(`[${error}] occured while processing save locations request`);
                    }
            });
        },
        publish_events: function(events){
            SERVICES.publishCustomEvents(events, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                let action = 'saved';
                let self = this;

                if (graphqlResponse && !error) {
                    self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
                }else{
                    action = 'failed';
                    console.error(`[${error}] occured while processing message request`);
                    self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
                }
            }));
        },
        remove_locations: function(siteId, modifiedLocations){
            let self = this;
            SERVICES.removeLocations(siteId, modifiedLocations, (error, response, body) => {
                if(!error && response.statusCode === 200) {
                    const action = 'saved';
                    const response = body.data.removeLocations.edges;
                    self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                }else{
                    console.error(`[${error}] occured while processing save locations request`);
                }
            });
        },
       load_localities: function (siteId) {
            let self = this;
            const edgeType = "Location";
            SERVICES.fetchEdges(siteId, edgeType, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            const action = false;
                            const response = body.data.locations ? body.data.locations.edges : [];
                            self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                        }else{
                            let error = 'Error, could not load keywords for admin page';
                            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                        }
            });
        },

        load_fb_pages: function(siteId) {
            let self = this;
            const days = 30;

            SERVICES.getAdminFbPages(siteId, days, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                let action = false;
                if (graphqlResponse && !error) {
                    const { pages, analytics } = graphqlResponse;

                    pages.pages.forEach(page => {
                        for(var i = 0;i < analytics.analytics.length; i++) {
                            if (page.pageUrl === analytics.analytics[i].Name) {
                                page.Count = analytics.analytics[i].Count;
                                page.LastUpdated = analytics.analytics[i].LastUpdated;
                                break;
                            }
                            page.Count = 0;
                        }
                    });

                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
                }else{
                    action = 'failed';
                    console.error(`[${error}] occured while processing FB pages request`);
                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
                }
            }));
        },
        load_trusted_twitter_accts: function(siteId) {
            let self = this;

            SERVICES.getTrustedTwitterAccounts(siteId, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                let action = false;
                if (graphqlResponse && !error) {
                    const { accounts } = graphqlResponse;
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
                }else{
                    action = 'failed';
                    console.error(`[${error}] occured while processing Trusted Twitter Accounts request`);
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
                }
            }));
        },
        load_places_inside_bbox: function(siteId, bbox) {
            let self = this;

            SERVICES.getPlacesByBBox(siteId, bbox, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                let action = false;
                if (graphqlResponse && !error) {
                    const { features } = graphqlResponse;
                    self.dispatch(constants.ADMIN.LOAD_PLACES, {action, features});
                }else{
                    action = 'failed';
                    console.error(`[${error}] occured while processing FB pages request`);
                    self.dispatch(constants.ADMIN.LOAD_PLACES, {action});
                }
            }));
        },
        load_blacklist: function(siteId) {
            let self = this;

            SERVICES.getBlacklistTerms(siteId, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
                let action = false;
                if (graphqlResponse && !error) {
                    const { filters } = graphqlResponse;
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action, filters});
                }else{
                    action = 'failed';
                    console.error(`[${error}] occured while processing FB pages request`);
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
                }
            }));
        },
        remove_blacklist: function(siteId, terms){
            let self = this;
            SERVICES.removeBlacklistTerms(siteId, terms, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { terms } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action:action, filters:terms});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing blacklist request`);
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
                }
            }));
        },
        save_blacklist: function(siteId, terms){
            let self = this;
            SERVICES.saveBlacklistTerms(siteId, terms, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { terms } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action:action, filters:terms});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing blacklist request`);
                    self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
                }
            }));
        },
        remove_fb_pages: function(siteId, pages){
            let self = this;
            SERVICES.removeFbPages(siteId, pages, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { pages } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing FB pages request`);
                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
                }
            }));
        },

        remove_trusted_twitter_accts: function(siteId, accounts){
            let self = this;
            SERVICES.removeTrustedTwitterAccts(siteId, accounts, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { accounts } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing Trusted Twitter Accounts request`);
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
                }
            }));
        },

        save_fb_pages: function(siteId, pages){
            let self = this;

            // Only add the RowKey and pageUrl in the Azure Table Storage
            let filteredInput = [];
            pages.forEach(page => {
                let filteredPage = {};
                filteredPage.RowKey = page.RowKey;
                filteredPage.pageUrl = page.pageUrl;
                filteredInput.push(filteredPage);
            });

            SERVICES.saveFbPages(siteId, filteredInput, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { pages } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing FB pages request`);
                    self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
                }
            }));
        },

        save_trusted_twitter_accts: function(siteId, accounts){
            let self = this;
            SERVICES.saveTrustedTwitterAccts(siteId, accounts, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
                let action = false;

                if (graphqlResponse && !gError) {
                    const { accounts } = graphqlResponse;
                    action = "saved";
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
                }else{
                    action = 'failed';
                    console.error(`[${gError}] occured while processing Trusted Twitter Accounts request`);
                    self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
                }
            }));
        }
    }
};

export const Actions = {
  constants: constants,
  methods: methods,
  DataSources: DataSources,
  DataSourceLookup
};
