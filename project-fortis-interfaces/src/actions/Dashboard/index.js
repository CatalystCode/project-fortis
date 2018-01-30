import { SERVICES as DashboardServices } from '../../services/Dashboard';
import { SERVICES as AdminServices } from '../../services/Admin';
import seqAsync from 'async/seq';
import constants from '../constants';
import { ResponseHandler } from '../shared';
import { momentGetFromToRange, doNothing } from '../../utils/Utils';

function toDataSources(streams) {
    streams = streams.filter(stream => stream.enabled);

    const dataSources = new Map();

    const allDataSource = {display: 'All', sourceValues: Array.from(new Set(streams.map(stream => stream.pipelineKey))), icon: 'fa fa-share-alt', label: constants.PIPELINE_ALL};
    dataSources.set(constants.PIPELINE_ALL, allDataSource);
    streams.forEach(stream => {
        const streamDataSource = {display: stream.pipelineLabel, sourceValues: [stream.pipelineKey], label: stream.pipelineKey, icon: stream.pipelineIcon};
        dataSources.set(stream.pipelineKey, streamDataSource);
    });

    const importDataSource = {display: 'Imported Events', sourceValues: [constants.PIPELINE_CUSTOM], label: constants.PIPELINE_CUSTOM, icon: 'fa fa-upload'};
    dataSources.set(constants.PIPELINE_CUSTOM, importDataSource);

    return dataSources;
}

function fetchCommonTerms(settings, callback, timespanType, fromDate, toDate, category) {
    let { configuration, terms, streams } = settings;
    configuration = configuration && configuration.site && configuration.site.properties;
    const dataSources = toDataSources((streams && streams.streams) || []);
    const siteName = settings.configuration.site.name;
    const bbox = configuration.targetBbox;
    const zoomLevel = configuration.defaultZoomLevel;

    DashboardServices.getCommonTerms(timespanType, fromDate, toDate, bbox, zoomLevel, category,
        (error, response, body) => ResponseHandler(error, response, body, (err, topics) => {
            if (!err) {
                callback(null, Object.assign({}, { terms, dataSources, siteName }, { configuration }, topics ));
            } else {
                callback(err, null);
            }
        }));
}

function fetchFullChartData(fromDate, toDate, periodType, dataSource, maintopic,
    bbox, zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics,
    includeCsv, enabledStreams, category, callback) {

    DashboardServices.getChartVisualizationData(periodType, maintopic, dataSource, fromDate, toDate,
        bbox, zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, !!includeCsv,
        enabledStreams, category, (err, response, body) => ResponseHandler(err, response, body, callback));
}

function fetchAllTrustedSources(resultsUnion, callback) {
    AdminServices.fetchTrustedSources((trustedSourcesErr, response, body) =>
        ResponseHandler(trustedSourcesErr, response, body, (err, data) => {
            if (err) {
                console.error(`Non-fatal error while fetching trusted sources: ${err}`)
                callback(null, resultsUnion);
            } else {
                const trustedSources = data.trustedSources && data.trustedSources.sources;
                resultsUnion.trustedSources = trustedSources;
                callback(null, resultsUnion);
            }
        })
    );
}

function fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, category, callback) {
    const { configuration, topics, dataSources } = resultUnion;

    if (!topics.edges.length) {
        return callback(null, resultUnion);
    }

    // grab the most commonly mentioned term
    const maintopic = topics.edges[0].name;

    // we're defaulting the timeseriesmaintopics to the most popular on the initial load so we can show all in the timeseries
    const timeseriesmaintopics = topics.edges.map(populartopic => populartopic.name);

    const includeCsv = false;
    const bbox = configuration.targetBbox;
    const dataSource = constants.DEFAULT_DATA_SOURCE;
    const externalsourceid = constants.DEFAULT_EXTERNAL_SOURCE;
    const zoomLevel = configuration.defaultZoomLevel;
    const conjunctivetopics = [];

    fetchFullChartData(fromDate, toDate, timespanType, dataSource, maintopic, bbox,
        zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics,
        includeCsv, dataSources, category, (err, chartData) => {
            const response = Object.assign({}, chartData, resultUnion, { category });

            if (err) {
                callback(err, response);
            } else {
                callback(null, response);
            }
        });
}

function fetchDashboardSiteDefinition(category, callback) {
    AdminServices.getDashboardSiteDefinition(null, category, (error, response, body) =>
        ResponseHandler(error, response, body, callback));
}

function isMostPopularTopicSelected(maintopic, popularTopics){
    return popularTopics.length && popularTopics[0].name === maintopic;
}

function handleError(error, dispatch, stepName) {
    error = error.message != null ? error : { message: error, code: -1}
    dispatch = dispatch != null ? dispatch : doNothing;

    const { message, code } = error;
    console.error(`${code}: error [${message}] occured while ${stepName}`);
    dispatch(constants.DASHBOARD.INITIALIZE, { error });
}

const _methods = {
    initializeDashboard(category, onFinished) {
        const { timespanType, datetimeSelection } = this.flux.stores.DataStore.dataStore;
        const formatter = constants.TIMESPAN_TYPES[timespanType];
        const dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
        const { fromDate, toDate } = dates;
        const self = this;

        const reportProgress = () => self.dispatch(constants.DASHBOARD.INITIALIZE_PROGRESS);
        onFinished = onFinished != null ? onFinished : doNothing;

        seqAsync(
            callback => {
                // Load the site settings
                fetchDashboardSiteDefinition(category, callback);
                reportProgress();
            },
            (settings, callback) => {
                // Load the top 5 most popular terms
                fetchCommonTerms(settings, callback, timespanType, fromDate, toDate, category);
                reportProgress();
            },
            (resultUnion, callback) => {
                // Merged Results(Settings + Full Term List + Popular Terms)
                fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, category, callback);
                reportProgress();
            },
            (resultUnion2, callback) => {
                // Merged Results(Settings + Full Term List + Popular Terms)
                fetchAllTrustedSources(resultUnion2, callback);
                reportProgress();
            },
        )((error, results) => {
            if (!error) {
                self.dispatch(constants.DASHBOARD.INITIALIZE, results);
                onFinished();
            } else {
                handleError(error, self.dispatch, 'fetching edge or site definition');
            }
        });
    },

    handleLoadSharedDashboardError(error) {
        handleError(error, this.dispatch, 'restoring dashboard from shared link');
    },

    reloadVisualizationState(fromDate, toDate, datetimeSelection, periodType, dataSource, maintopic, bbox,
                             zoomLevel, conjunctivetopics, externalsourceid, includeCsv, place, onFinished) {
        const self = this;
        const { category, popularTerms, enabledStreams } = this.flux.stores.DataStore.dataStore;
        onFinished = onFinished != null ? onFinished : doNothing;

        const timeseriesmaintopics = isMostPopularTopicSelected(maintopic, popularTerms) ? popularTerms.map(topic => topic.name) : [maintopic];

        fetchFullChartData(fromDate, toDate, periodType, dataSource, maintopic, bbox, zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, includeCsv, enabledStreams, category, (err, chartData) => {
            if (!err) {
                const placeid = place && place.placeid ? place.placeid : "";
                const name = place && place.name ? place.name : "";
                const placecentroid = place && place.placecentroid ? place.placecentroid : [];
                const placebbox = place && place.placebbox ? place.placebbox : [];

                let mutatedFilters = { fromDate, toDate, name, placeid, placebbox, placecentroid, datetimeSelection, periodType, dataSource, maintopic, externalsourceid, zoomLevel, bbox };
                mutatedFilters.selectedconjunctiveterms = conjunctivetopics;

                self.dispatch(constants.DASHBOARD.RELOAD_CHARTS, Object.assign({}, mutatedFilters, chartData));
                onFinished();
            } else {
                handleError(err, null, 'processing tile visualization re-sync request');
            }
        })
    },

    handleAuth(authInfo) {
        this.dispatch(constants.DASHBOARD.AUTH_USER, authInfo);
    },

    changeLanguage(language, category) {
        const self = this;

        AdminServices.getWatchlist(language, category, (error, response, body) => {
            if (!error && response.statusCode === 200 && body.data && !body.errors) {
                const { terms } = body.data;

                self.dispatch(constants.DASHBOARD.CHANGE_LANGUAGE, { language, terms });
            } else {
                handleError(error, self.dispatch, 'changing language');
            }
        })
    }
};

const methods = { DASHBOARD: _methods };

module.exports = {
    constants,
    methods
};
