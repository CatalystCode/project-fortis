import { Actions } from '../actions/Actions';
import { momentToggleFormats, momentGetFromToRange } from '../utils/Utils.js';
import request from 'request';

const MAX_ZOOM = 15;
const locationEdgeFragment = `fragment FortisDashboardLocationEdges on LocationCollection {
                                        runTime
                                        edges {
                                            name
                                            name_ar
                                            name_ur
                                            name_id
                                            name_de
                                            type
                                            coordinates
                                            population
                                            aciiname
                                            region
                                            RowKey
                                            originalsource
                                            country_iso
                                            alternatenames
                                        }
                                    }`;

const termsEdgeFragment = ` fragment FortisDashboardTermEdges on TermCollection {
                                    runTime
                                    edges {
                                        name
                                        type
                                        name_ar
                                        name_de
                                        name_ur
                                        name_id
                                        RowKey
                                    }
                                }`;

const twitterFragment = `fragment FortisTwitterAcctView on TwitterAccountCollection {
                            accounts {
                                    accountName
                                    consumerKey
                                    token
                                    consumerSecret
                                    tokenSecret
                            }
                        }`;

const trustedTwitterFragment = `fragment FortisTrustedTwitterAcctView on TrustedTwitterAccountCollection {
                            accounts {
                                    RowKey
                                    acctUrl
                            }
                        }`;

const siteSettingsFragment = `fragment FortisSiteDefinitionView on SiteCollection {
                            sites {
                                name
                                properties {
                                    targetBbox
                                    defaultZoomLevel
                                    logo
                                    title
                                    fbToken
                                    mapzenApiKey
                                    defaultLocation
                                    storageConnectionString
                                    featuresConnectionString
                                    supportedLanguages
                                }
                            }
                        }`;

const fbPageAnalyticsFragment = `fragment FortisAdminSettingsView on FacebookPageAnalyticsCollection {
                        analytics {
                            Name,
                            Count,
                            LastUpdated
                        }
                      }`;

const fbPageFragment = `fragment FortisDashboardView on FacebookPageCollection {
                        runTime
                        pages {
                            RowKey
                            pageUrl
                        }
                      }`;

const blacklistFragment = `fragment FortisDashboardView on BlacklistCollection {
                        runTime
                        filters {
                            filteredTerms
                            lang
                            RowKey
                        }
                      }`;

const placeCollectiontFragment = `fragment FortisDashboardLocations on PlaceCollection {
                                        features {
                                            coordinates
                                            tileId
                                            name
                                            kind
                                            source
                                            id
                                            name_ar
                                            name_ur
                                            name_de
                                            name_id
                                            population
                                        }
                                  }`;

const topSourcesFragment = `fragment FortisTopSourcesView on TopSourcesCollection {
                                            sources {
                                                Name,
                                                Count,
                                                Source
                                            }
                                        }
                                        `;

const visualizationChartFragments = `fragment FortisDashboardTimeSeriesView on EdgeTimeSeriesCollection {
                                            labels {
                                                name
                                                mentions
                                            }
                                            graphData {
                                                edges
                                                mentions
                                                date
                                            }
                                        }

                                        fragment FortisDashboardLocationView on TopNLocationCollection {
                                        runTime
                                        edges {
                                                name
                                                mentions
                                                coordinates
                                                population
                                            }
                                        }`;

export const SERVICES = {
    getChartVisualizationData(site, datetimeSelection, timespanType, selectedEntity, unpopularSelectedTerm, mainEdge, dataSource, fromDate, toDate, callback){
        let formatter = Actions.constants.TIMESPAN_TYPES[timespanType];
        let timespan = momentToggleFormats(datetimeSelection, formatter.format, formatter.blobFormat);
        let sourceFilter = Actions.DataSources(dataSource);
        let selectedTerm = selectedEntity && selectedEntity.type === "Term" ? selectedEntity.name : undefined;
        let additionalTerms = unpopularSelectedTerm;
        let limit = 5;

        let query = `${visualizationChartFragments}
                     ${selectedTerm ? `${topSourcesFragment}` : ``}
                      query PopularEdges($site: String!, $additionalTerms: String, $timespan: String!, $sourceFilter: [String], ${selectedTerm ? `$selectedTerm: String!, $limit: Int!,` : `,`} $fromDate: String!, $toDate: String!) {
                            timeSeries:timeSeries(site: $site, sourceFilter: $sourceFilter, fromDate: $fromDate, toDate: $toDate, mainEdge: $additionalTerms){
                                                        ...FortisDashboardTimeSeriesView
                            },
                            locations: popularLocations(site: $site, timespan: $timespan, sourceFilter: $sourceFilter) {
                                                        ...FortisDashboardLocationView
                            }${selectedTerm ? `, 
                            topSources(site: $site, fromDate: $fromDate, toDate: $toDate, limit: $limit, mainTerm: $selectedTerm, sourceFilter: $sourceFilter) {
                            ... FortisTopSourcesView
                            }`: ``}
                       }`;

        let variables = { site, additionalTerms, selectedTerm, timespan, limit, sourceFilter, fromDate, toDate };
        let host = process.env.REACT_APP_SERVICE_HOST;
        let POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    getTopSourcesChartData(site, datetimeSelection, selectedTerm, fromDate, toDate, dataSource, callback){
        let limit = 5;
        let sourceFilter = Actions.DataSources(dataSource);
        let query = `${topSourcesFragment}
                      query TopSources($site: String!, $limit: Int!, $fromDate: String!, $toDate: String!, $selectedTerm: String, $sourceFilter: [String]) {
                            topSources(site: $site, fromDate: $fromDate, toDate: $toDate, limit: $limit, mainTerm: $selectedTerm, sourceFilter: $sourceFilter) {
                            ... FortisTopSourcesView
                            }
                       }`;

        let variables = { site, selectedTerm, limit, fromDate, toDate, sourceFilter };
        let host = process.env.REACT_APP_SERVICE_HOST;
        let POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    fetchEdges(site, edgeType, callback){
        const locationsQuery = `locations: locations(site: $site) {
                                ...FortisDashboardLocationEdges
                            }`;

        const termsQuery = `terms: terms(site: $site) {
                                ...FortisDashboardTermEdges
                         }`;

        const fragments = `${edgeType === "All" || edgeType === "Location" ? locationEdgeFragment : ``}
                        ${edgeType === "All" || edgeType === "Term" ? termsEdgeFragment : ``}`;

        const queries = `${edgeType === "All" || edgeType === "Location" ? locationsQuery : ``}
                      ${edgeType === "All" || edgeType === "Term" ? termsQuery : ``}`;

        const query = `  ${fragments}
                      query FetchAllEdge($site: String!) {
                            ${queries}
                        }`;

        const variables = {site};
        const host = process.env.REACT_APP_SERVICE_HOST;
        const POST = {
                url : `${host}/api/edges`,
                method : "POST",
                json: true,
                withCredentials: false,
                body: { query, variables }
            };

        request(POST, callback);
  },

  getHeatmapTiles(site, timespanType, zoom, mainEdge, datetimeSelection, bbox,
        filteredEdges, locations, sourceFilter, originalSource, callback) {
        const formatter = Actions.constants.TIMESPAN_TYPES[timespanType];
        const timespan = momentToggleFormats(datetimeSelection, formatter.format, formatter.blobFormat);
        let dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
        let fromDate = dates.fromDate, toDate = dates.toDate;

        const zoomLevel = MAX_ZOOM;

        console.log(`processing tile request [${mainEdge}, ${timespan}, ${bbox}, ${filteredEdges.join(",")}]`)
        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
            const featuresFragmentView = `fragment FortisDashboardViewFeatures on FeatureCollection {
                                        runTime
                                        features {
                                            type
                                            coordinates
                                            properties {
                                                neg_sentiment
                                                pos_sentiment
                                                location
                                                mentionCount
                                                tileId
                                                population
                                                location
                                            }
                                        }
                                     }`;

            const edgesFragmentView = `fragment FortisDashboardViewEdges on EdgeCollection {
                                        runTime
                                        edges {
                                            type
                                            name
                                            mentionCount
                                        }
                                    }`;

            let query, variables;

            if (locations && locations.length > 0 && locations[0].length > 0) {
                query = `${edgesFragmentView}
                     ${featuresFragmentView}
                        query FetchAllEdgesAndTilesByLocations($site: String!, $locations: [[Float]]!, $filteredEdges: [String], $timespan: String!, $sourceFilter: [String], $fromDate: String, $toDate: String) {
                            features: fetchTilesByLocations(site: $site, locations: $locations, filteredEdges: $filteredEdges, timespan: $timespan, sourceFilter: $sourceFilter, fromDate: $fromDate, toDate: $toDate) {
                                ...FortisDashboardViewFeatures
                            }
                            edges: fetchEdgesByLocations(site: $site, locations: $locations, timespan: $timespan, sourceFilter: $sourceFilter, fromDate: $fromDate, toDate: $toDate) {
                                ...FortisDashboardViewEdges
                            }
                        }`;

                variables = { site, locations, filteredEdges, timespan, sourceFilter };
            } else {
                query = `${edgesFragmentView}
                    ${featuresFragmentView}
                      query FetchAllEdgesAndTilesByBBox($site: String!, $bbox: [Float]!, $mainEdge: String!, $filteredEdges: [String], $timespan: String!, $zoomLevel: Int, $sourceFilter: [String], $fromDate: String, $toDate: String, originalSource: String) {
                            features: fetchTilesByBBox(site: $site, bbox: $bbox, mainEdge: $mainEdge, filteredEdges: $filteredEdges, timespan: $timespan, zoomLevel: $zoomLevel, sourceFilter: $sourceFilter, fromDate: $fromDate, toDate: $toDate, originalSource: $originalSource) {
                                ...FortisDashboardViewFeatures
                            }
                            edges: fetchEdgesByBBox(site: $site, bbox: $bbox, zoomLevel: $zoomLevel, mainEdge: $mainEdge, timespan: $timespan, sourceFilter: $sourceFilter, fromDate: $fromDate, toDate: $toDate, originalSource: $originalSource) {
                                ...FortisDashboardViewEdges
                            }
                        }`;

                variables = { site, bbox, mainEdge, filteredEdges, timespan, zoomLevel, sourceFilter, fromDate, toDate, originalSource };
            }

            let host = process.env.REACT_APP_SERVICE_HOST

            var POST = {
                url: `${host}/api/tiles`,
                method: "POST",
                json: true,
                withCredentials: false,
                body: { query, variables }
            };
            request(POST, callback);
        } else {
            throw new Error(`Invalid bbox format for value [${bbox}]`);
        }
    },

    getSiteDefintion(siteId, retrieveSiteList, callback) {
        const fragment = `${siteSettingsFragment}
                        ${retrieveSiteList ? `fragment FortisSitesListView on SiteCollection {
                            sites {
                                name
                            }
                        }`: ``}`;

        const query = `  ${fragment}
                        query Sites($siteId: String) {
                            siteDefinition: sites(siteId: $siteId) {
                                ...FortisSiteDefinitionView
                            }
                            ${retrieveSiteList ? `siteList: sites(siteId: "") {
                                ...FortisSitesListView
                            }`: ``}
                        }`;

        const variables = { siteId };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    getPlacesByBBox(site, bbox, callback) {
        const query = `  ${placeCollectiontFragment}
                        query FetchPlaces($site: String!, $bbox: [Float]!, $zoom: Int) {
                            features: fetchPlacesByBBox(site: $site, bbox: $bbox, zoom: $zoom) {
                                ...FortisDashboardLocations
                            }
                        }`;
        const zoom = 8;
        const variables = { site, bbox, zoom };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/tiles`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    saveTwitterAccounts(site, accounts, mutation, callback) {
        const query = ` ${twitterFragment} 
                      mutation ModifyTwitterAccounts($input: TwitterAccountDefintion!) {
                            streams: ${mutation}(input: $input) {
                                ...FortisTwitterAcctView
                            }
                        }`;

        const variables = { input: { accounts, site } };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    publishCustomEvents(messages, callback) {
        const query = ` mutation PublishEvents($input: NewMessages!) {
                            events: publishEvents(input: $input) 
                        }`;

        const variables = { input: { messages } };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/messages`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    getTwitterAccounts(siteId, callback) {
        let query = `  ${twitterFragment}
                        query TwitterAccounts($siteId: String!) {
                            streams: twitterAccounts(siteId: $siteId) {
                                ...FortisTwitterAcctView
                            }
                        }`;

        let variables = { siteId };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    getTrustedTwitterAccounts(siteId, callback) {
        let query = `  ${trustedTwitterFragment}
                        query TrustedTwitterAccounts($siteId: String!) {
                            accounts: trustedTwitterAccounts(siteId: $siteId) {
                                ...FortisTrustedTwitterAcctView
                            }
                        }`;

        let variables = { siteId };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    saveKeywords(site, edges, callback) {
        const query = `${termsEdgeFragment} 
                        mutation AddKeywords($input: EdgeTerms!) {
                            addKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    saveLocations(site, edges, callback) {
        const query = `${locationEdgeFragment} 
                        mutation SaveLocations($input: EdgeLocations!) {
                            saveLocations(input: $input) {
                                ...FortisDashboardLocationEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    removeLocations(site, edges, callback) {
        const query = `${locationEdgeFragment} 
                        mutation removeLocations($input: EdgeLocations!) {
                            removeLocations(input: $input) {
                                ...FortisDashboardLocationEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    createOrReplaceSite(siteName, siteDefinition, callback) {
        let query = `  mutation CreateOrReplaceSite($input: SiteDefinition!) {
                            createOrReplaceSite(input: $input) {
                                name
                            }
                        }`;

        let variables = { input: siteDefinition };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    removeKeywords(site, edges, callback) {
        const query = `${termsEdgeFragment} 
                        mutation RemoveKeywords($input: EdgeTerms!) {
                            removeKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    FetchMessageDetail(site, messageId, dataSources, sourcePropeties, callback) {
        const properties = sourcePropeties.join(' ');
        const messageDetailsFragment = `fragment FortisDashboardView on Feature {
                        coordinates
                        properties {
                            edges
                            messageid
                            createdtime
                            sentiment
                            sentence
                            language
                            source
                            fullText
                            properties {
                                title
                                link
                                originalSources
                                ${properties}
                            }
                        }
                    }`;

         const query = `  ${messageDetailsFragment} 
                        query FetchEvent($site: String!, $messageId: String!, $dataSources: [String]!, $langCode: String) { 
                            event(site: $site, messageId: $messageId, dataSources: $dataSources, langCode: $langCode) {
                                ...FortisDashboardView 
                            }
                        }`;

         const variables = { site, messageId, dataSources };
         const host = process.env.REACT_APP_SERVICE_HOST;
         const POST = {
                url: `${host}/api/Messages`,
                method: "POST",
                json: true,
                withCredentials: false,
                body: { query, variables }
            };
         request(POST, callback);
    },

    FetchTerms(site, query, fromDate, toDate, sourceFilter, callback) {
        const fragmentView = `fragment FortisTermsView on TermCollection { 
                                    edges { 
                                        RowKey, 
                                        name, 
                                        name_ar,
                                        name_id,
                                        name_de,
                                        name_ur
                                    }
                                }`;

        const graphQuery = `${fragmentView}
                            query FetchTerms($site: String!, $query: String, $fromDate: String, $toDate: String, $sourceFilter: [String]) {
                                 terms(site: $site, query: $query, fromDate: $fromDate, toDate: $toDate, sourceFilter: $sourceFilter){
                                     ...FortisTermsView
                                 }
                            }`;

        const variables = { site, query, fromDate, toDate, sourceFilter };
        
        let host = process.env.REACT_APP_SERVICE_HOST;
        var POST = {
            url: `${host}/api/Edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { "query":graphQuery, variables }
        };

        request(POST, callback);
    },

    FetchMessages(site, originalSource, filteredEdges, langCode, limit, offset, fromDate, toDate, sourceFilter, fulltextTerm, sourceProperties, callback) {
        const properties = sourceProperties.length > 0 ? "properties {{0}}".format(sourceProperties.join(' ')) : "";
        const fragmentView = `fragment FortisMessagesView on FeatureCollection {
                                    features {
                                        coordinates
                                        properties {
                                            messageid,
                                            sentence,
                                            edges,
                                            createdtime,
                                            sentiment,
                                            language,
                                            source,
                                            ${properties}
                                        }
                                    }
                                }`;

        const query =  `${fragmentView}
                       query FetchMessages($site: String!, $filteredEdges: [String]!, $langCode: String!, $limit: Int, $offset: Int, $fromDate: String!, $toDate: String!, $sourceFilter: [String], $fulltextTerm: String) {
                            byEdges(site: $site, filteredEdges: $filteredEdges, langCode: $langCode, limit: $limit, offset: $offset, fromDate: $fromDate, toDate: $toDate, sourceFilter: $sourceFilter, fulltextTerm: $fulltextTerm) {
                                ...FortisMessagesView
                            }
                        }`;
        const variables = { site, originalSource, filteredEdges, langCode, limit, offset, fromDate, toDate, sourceFilter, fulltextTerm };
        
        let host = process.env.REACT_APP_SERVICE_HOST;
        var POST = {
            url: `${host}/api/Messages`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    FetchMessageSentences(site, originalSource, bbox, datetimeSelection, timespanType, limit, offset, filteredEdges, langCode, sourceFilter, mainTerm, fulltextTerm, coordinates, callback) {
        let formatter = Actions.constants.TIMESPAN_TYPES[timespanType];
        let dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
        let fromDate = dates.fromDate, toDate = dates.toDate;

        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
            let fragmentView = `fragment FortisDashboardView on FeatureCollection {
                                type
                                runTime
                                    features {
                                        type
                                        coordinates
                                        properties {
                                            messageid,
                                            sentence,
                                            edges,
                                            createdtime,
                                            sentiment,
                                            language,
                                            source
                                            properties {
                                                originalSources
                                                title
                                                link
                                            }
                                        }
                                    }
                                }`;

            let query, variables;

            if (coordinates && coordinates.length === 2) {
                query = `  ${fragmentView}
                       query ByLocation($site: String!, $originalSource: String, $coordinates: [Float]!, $filteredEdges: [String]!, $langCode: String!, $limit: Int!, $offset: Int!, $fromDate: String!, $toDate: String!, $sourceFilter: [String], $fulltextTerm: String) { 
                             byLocation(site: $site, originalSource: $originalSource, coordinates: $coordinates, filteredEdges: $filteredEdges, langCode: $langCode, limit: $limit, offset: $offset, fromDate: $fromDate, toDate: $toDate, sourceFilter: $sourceFilter, fulltextTerm: $fulltextTerm) {
                                ...FortisDashboardView 
                            }
                        }`;
                variables = { site, coordinates, filteredEdges, langCode, limit, offset, fromDate, toDate, sourceFilter, fulltextTerm };
            } else {
                query = `  ${fragmentView}
                       query ByBbox($site: String!, $originalSource: String, $bbox: [Float]!, $mainTerm: String, $filteredEdges: [String]!, $langCode: String!, $limit: Int!, $offset: Int!, $fromDate: String!, $toDate: String!, $sourceFilter: [String], $fulltextTerm: String) { 
                             byBbox(site: $site, originalSource: $originalSource, bbox: $bbox, mainTerm: $mainTerm, filteredEdges: $filteredEdges, langCode: $langCode, limit: $limit, offset: $offset, fromDate: $fromDate, toDate: $toDate, sourceFilter: $sourceFilter, fulltextTerm: $fulltextTerm) {
                                ...FortisDashboardView 
                            }
                        }`;
                variables = { site, originalSource, bbox, mainTerm, filteredEdges, langCode, limit, offset, fromDate, toDate, sourceFilter, fulltextTerm };
            }

            let host = process.env.REACT_APP_SERVICE_HOST
            var POST = {
                url: `${host}/api/Messages`,
                method: "POST",
                json: true,
                withCredentials: false,
                body: { query, variables }
            };

            request(POST, callback);
        } else {
            callback(new Error(`Invalid bbox format for value [${bbox}]`));
        }
  },
  getAdminFbPages(siteId, days, callback){
      let query = ` ${fbPageFragment},
                    ${fbPageAnalyticsFragment}
                         query FacebookPages($siteId: String!, $days: Int!) {
                            pages: facebookPages(siteId: $siteId) {
                                ...FortisDashboardView
                            },
                            analytics: facebookAnalytics(siteId: $siteId, days: $days)
                            {
                                ...FortisAdminSettingsView
                            }
                        }`;

        let variables = { siteId, days };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  saveFbPages(site, pages, callback) {
        const query = `${fbPageFragment} 
                        mutation ModifyFacebookPages($input: FacebookPageListInput!) {
                            pages: modifyFacebookPages(input: $input) {
                                ...FortisDashboardView
                            }
                        }`;

        const variables = { input: { pages, site } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  saveTrustedTwitterAccts(site, accounts, callback) {
        const query = `${trustedTwitterFragment} 
                        mutation ModifyTrustedTwitterAccounts($input: TrustedTwitterAccountDefintion!) {
                            accounts: modifyTrustedTwitterAccounts(input: $input) {
                                ...FortisTrustedTwitterAcctView
                            }
                        }`;

        const variables = { input: { accounts, site } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  removeFbPages(site, pages, callback) {
        const query = `${fbPageFragment} 
                        mutation RemoveFacebookPages($input: FacebookPageListInput!) {
                            pages: removeFacebookPages(input: $input) {
                                ...FortisDashboardView
                            }
                        }`;

        const variables = { input: { pages, site } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  removeTrustedTwitterAccts(site, accounts, callback) {
      const query = `${trustedTwitterFragment} 
                        mutation RemoveTrustedTwitterAccounts($input: TrustedTwitterAccountDefintion!) {
                            accounts: removeTrustedTwitterAccounts(input: $input) {
                                ...FortisTrustedTwitterAcctView
                            }
                        }`;

      const variables = { input: { accounts, site } };

      const host = process.env.REACT_APP_SERVICE_HOST
      const POST = {
          url: `${host}/api/settings`,
          method: "POST",
          json: true,
          withCredentials: false,
          body: { query, variables }
      };

      request(POST, callback);
  },
  getBlacklistTerms(siteId, callback){
      let query = `  ${blacklistFragment}
                        query TermBlacklist($siteId: String!) {
                            filters: termBlacklist(siteId: $siteId) {
                                ...FortisDashboardView
                            }
                        }`;

        let variables = { siteId };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  saveBlacklistTerms(site, terms, callback) {
        const query = `${blacklistFragment} 
                        mutation ModifyBlacklist($input: BlacklistTermDefintion!) {
                            terms: modifyBlacklist(input: $input) {
                                ...FortisDashboardView
                            }
                        }`;

        const variables = { input: { terms, site } };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  removeBlacklistTerms(site, terms, callback) {
        const query = `${blacklistFragment} 
                        mutation RemoveBlacklist($input: BlacklistTermDefintion!) {
                            terms: removeBlacklist(input: $input) {
                                ...FortisDashboardView
                            }
                        }`;

        const variables = { input: { terms, site } };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  translateSentences(words, fromLanguage, toLanguage, callback){
      let query = ` fragment FortisDashboardWords on TranslatedWords {
                        words {
                            originalSentence
                            translatedSentence
                        }
                     }

                    query Translate($words: [String]!, $fromLanguage: String!, $toLanguage:String!) {
                        results: translateWords(words: $words, fromLanguage: $fromLanguage, toLanguage:$toLanguage) {
                            ...FortisDashboardWords
                        }
                    }`;

        let variables = { words, fromLanguage, toLanguage };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/messages`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
  },
  translateSentence(sentence, fromLanguage, toLanguage, callback) {
      let query = `
        fragment TranslationView on TranslationResult{
            translatedSentence
            } 

            query FetchEvent($sentence: String!, $fromLanguage: String!, $toLanguage: String!) {

            translate(sentence: $sentence, fromLanguage: $fromLanguage, toLanguage: $toLanguage){
                ...TranslationView
            }
        }`
      let variables = {sentence, fromLanguage, toLanguage};
      let host = process.env.REACT_APP_SERVICE_HOST;
      var POST = {
           url : `${host}/api/Messages`,
            method : "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };
     
        request(POST, (error, response, body) => {
            if(!error && body && body.data && body.data.translate && body.data.translate.translatedSentence){
                callback(body.data.translate.translatedSentence);
            }
            else{
                callback(undefined, error || 'Translate request failed: ' + JSON.stringify(response));
            }
        });
  }
}
