import constants from '../../actions/constants';
import * as ActionMethods from '../../actions/shared';
import * as DashboardFragments from '../graphql/fragments/Dashboard';
import * as DashboardQueries from '../graphql/queries/Dashboard';
import { fetchGqlData } from '../shared';
import request from 'request';

export const SERVICES = {
    getChartVisualizationData(periodType, maintopic, dataSource, fromDate, toDate, bbox,
        zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, csv, callback) {
        const timePeriodType = constants.TIMESPAN_TYPES[periodType].timeseriesType;
        const topsourcespipelinekey = ActionMethods.DataSources(dataSource);
        const pipelinekeys = constants.DEFAULT_EXTERNAL_SOURCE === externalsourceid 
        ? [dataSource] : topsourcespipelinekey;

        const limit = 5;
        const gqlEndpoint = 'edges';

        const selectionFragments = `${DashboardFragments.topSourcesFragment}
                                      ${DashboardFragments.conjunctiveTermsFragment}
                                      ${DashboardFragments.visualizationChartFragment}
                                      ${DashboardFragments.popularPlacesFragment}
                                      ${DashboardFragments.termsFragment}`;

        const query = `${selectionFragments}
                       ${DashboardQueries.DashboardQuery}`;

        const variables = {
            bbox, limit, fromDate, topsourcespipelinekey, pipelinekeys,
            toDate, zoomLevel, periodType, timePeriodType, externalsourceid, maintopic,
            timeseriesmaintopics, conjunctivetopics, csv
        };
        fetchGqlData(gqlEndpoint, { variables, query }, callback);
    },
    
    getCommonTerms(periodType, fromDate, toDate, bbox, zoomLevel, callback) {
        const pipelinekeys = [constants.DEFAULT_DATA_SOURCE];
        const limit = 5;
        const csv = false;
        const externalsourceid = constants.DEFAULT_EXTERNAL_SOURCE;
        const selectionFragments = `${DashboardFragments.termsFragment}`;
        const gqlEndpoint = 'edges';
        const query = `${selectionFragments}
                       ${DashboardQueries.getPopularTermsQuery}`;

        const variables = {
            bbox, limit, fromDate, pipelinekeys,
            toDate, zoomLevel, periodType, externalsourceid,
            csv
        };
        fetchGqlData(gqlEndpoint, { variables, query }, callback);
    },

    getHeatmapTiles(fromDate, toDate, zoomLevel, maintopic, tileid, periodType, 
                    dataSource, externalsourceid, conjunctivetopics, callback) {
        console.log(`processing tile request [${maintopic}, ${fromDate}, ${toDate}, ${tileid}}]`)
        const topsourcespipelinekey = ActionMethods.DataSources(dataSource);
        const pipelinekeys = constants.DEFAULT_EXTERNAL_SOURCE === externalsourceid 
        ? [dataSource] : topsourcespipelinekey;

        const query = `${DashboardFragments.heatmapFragment}
                       ${DashboardQueries.getHeatmapQuery}`;
        const gqlEndpoint = 'tiles';
        const variables = { fromDate, toDate, zoomLevel, maintopic, tileid, periodType, 
            pipelinekeys, externalsourceid, conjunctivetopics
        };

        fetchGqlData(gqlEndpoint, { variables, query }, callback);
    },

    FetchMessageDetail(messageId, callback) {
        const query = ` ${DashboardFragments.eventDetailsFragment} 
                        ${DashboardQueries.getEventDetailsQuery}`;

        const variables = { messageId };
        const gqlEndpoint = 'Messages';
        fetchGqlData(gqlEndpoint, { variables, query }, callback);
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

        const query = `${fragmentView}
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

    FetchMessageSentences(externalsourceid, bbox, zoomLevel, fromDate, toDate, limit, pageState, conjunctivetopics, pipelinekeys, fulltextTerm, callback) {
        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
            const gqlEndpoint = 'Messages';
            const query = ` ${DashboardFragments.getMessagesByBbox}
                            ${DashboardQueries.getMessagesByBbox}`;

            const variables = { bbox, conjunctivetopics, zoomLevel, limit, pageState, fromDate, toDate, externalsourceid, pipelinekeys, fulltextTerm };

            fetchGqlData(gqlEndpoint, { variables, query }, callback);
        } else {
            callback(new Error(`Invalid bbox format for value [${bbox}]`));
        }
    },

    translateSentences(words, fromLanguage, toLanguage, callback) {
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
        let query = `${DashboardFragments.translationEventFragment}
                     ${DashboardQueries.translateEvent}
        }`
        let variables = { sentence, fromLanguage, toLanguage };
        let host = process.env.REACT_APP_SERVICE_HOST;
        var POST = {
            url: `${host}/api/Messages`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    }
}