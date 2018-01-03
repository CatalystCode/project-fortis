import constants from '../../actions/constants';
import * as ActionMethods from '../../actions/shared';
import * as DashboardFragments from '../graphql/fragments/Dashboard';
import * as DashboardQueries from '../graphql/queries/Dashboard';
import { fetchGqlData, MESSAGES_ENDPOINT, TILES_ENDPOINT, EDGES_ENDPOINT } from '../shared';

export const SERVICES = {
    getChartVisualizationData(periodType, maintopic, dataSource, fromDate, toDate, bbox,
        zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, csv,
        enabledStreams, category, callback) {
        const timePeriodType = constants.TIMESPAN_TYPES[periodType].timeseriesType;
        const topsourcespipelinekey = ActionMethods.DataSources(dataSource, enabledStreams);
        const pipelinekeys = constants.DEFAULT_EXTERNAL_SOURCE === externalsourceid
        ? [dataSource] : topsourcespipelinekey;

        const limit = 10;

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
            timeseriesmaintopics, conjunctivetopics, csv, category
        };
        fetchGqlData(EDGES_ENDPOINT, { variables, query }, callback);
    },

    getCommonTerms(periodType, fromDate, toDate, bbox, zoomLevel, category, callback) {
        const pipelinekeys = [constants.DEFAULT_DATA_SOURCE];
        const limit = 12;
        const csv = false;
        const externalsourceid = constants.DEFAULT_EXTERNAL_SOURCE;
        const selectionFragments = `${DashboardFragments.termsFragment}`;
        const query = `${selectionFragments}
                       ${DashboardQueries.getPopularTermsQuery}`;

        const variables = {
            bbox, limit, fromDate, pipelinekeys,
            toDate, zoomLevel, periodType, externalsourceid, category,
            csv
        };
        fetchGqlData(EDGES_ENDPOINT, { variables, query }, callback);
    },

    getHeatmapTiles(fromDate, toDate, zoomLevel, maintopic, tileid, periodType,
                    dataSource, externalsourceid, conjunctivetopics, bbox,
                    enabledStreams, callback) {
        const topsourcespipelinekey = ActionMethods.DataSources(dataSource, enabledStreams);
        const pipelinekeys = constants.DEFAULT_EXTERNAL_SOURCE === externalsourceid
        ? [dataSource] : topsourcespipelinekey;

        const query = `${DashboardFragments.heatmapFragment}
                       ${DashboardQueries.getHeatmapQuery}`;
        const variables = { fromDate, toDate, zoomLevel, maintopic, tileid, periodType,
            pipelinekeys, externalsourceid, conjunctivetopics, bbox
        };

        fetchGqlData(TILES_ENDPOINT, { variables, query }, callback);
    },

    FetchMessageDetail(messageId, callback) {
        const query = ` ${DashboardFragments.eventDetailsFragment}
                        ${DashboardQueries.getEventDetailsQuery}`;

        const variables = { messageId };
        fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
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
        fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
    },

    FetchMessageSentences(externalsourceid, bbox, zoomLevel, fromDate, toDate, limit, pageState, conjunctivetopics, pipelinekeys, fulltextTerm, callback) {
        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
            const query = ` ${DashboardFragments.getMessagesByBbox}
                            ${DashboardQueries.getMessagesByBbox}`;

            const variables = { bbox, conjunctivetopics, zoomLevel, limit, pageState, fromDate, toDate, externalsourceid, pipelinekeys, fulltextTerm };

            fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
        } else {
            callback(new Error(`Invalid bbox format for value [${bbox}]`));
        }
    },

    translateSentences(words, fromLanguage, toLanguage, callback) {
      const query = `${DashboardFragments.translatedWordsFragment}${DashboardQueries.getTranslatedWords}`;
      const variables = { words, fromLanguage, toLanguage };
      fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
    },

    translateSentence(sentence, fromLanguage, toLanguage, callback) {
        const query = `${DashboardFragments.translationEventFragment}
                       ${DashboardQueries.translateEvent}
        }`
        const variables = { sentence, fromLanguage, toLanguage };
        fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
    }
}