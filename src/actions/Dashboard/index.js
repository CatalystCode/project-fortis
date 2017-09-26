import { SERVICES as DashboardServices } from '../../services/Dashboard';
import { SERVICES as AdminServices } from '../../services/Admin';
import seqAsync from 'async/seq';
import constants from '../constants';
import { ResponseHandler } from '../shared';
import { momentGetFromToRange } from '../../utils/Utils';

function toDataSources(streams) {
    const dataSources = new Map();

    streams = streams.filter(stream=>stream.enabled);
    const allDataSource = {display: 'All', sourceValues: Array.from(new Set(streams.map(stream => stream.pipelineKey))), icon: 'fa fa-share-alt', label: 'all'};
    dataSources.set('all', allDataSource);
    streams.forEach(stream => {
        const streamDataSource = {display: stream.pipelineLabel, sourceValues: [stream.pipelineKey], label: stream.pipelineKey, icon: stream.pipelineIcon};
        dataSources.set(stream.pipelineKey, streamDataSource);
    });

    const importDataSource = {display: 'Imported Events', sourceValues: ['custom'], label: 'custom', icon: 'fa fa-upload'};
    dataSources.set('custom', importDataSource);

    return dataSources;
}

function fetchCommonTerms(settings, callback, timespanType, fromDate, toDate, category) {
    let { configuration, terms, streams } = settings;
    configuration = configuration && configuration.site && configuration.site.properties;
    const dataSources = toDataSources((streams && streams.streams) || []);

    DashboardServices.getCommonTerms(timespanType, fromDate, toDate, configuration.targetBbox, configuration.defaultZoomLevel, category, 
        (error, response, body) => ResponseHandler(error, response, body, (err, topics) => {
            if (!err) {
                callback(null, Object.assign({}, { terms, dataSources }, { configuration }, topics ));
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

function fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, category, callback) {
    const { configuration, topics, dataSources } = resultUnion;

    if (topics.edges.length) {
        const includeCsv = false;
        const maintopic = topics.edges[0].name;//grab the most commonly mentioned term
        //we're defaulting the timeseriesmaintopics to the most popular on the initial load so we can show all in the timeseries
        fetchFullChartData(fromDate, toDate, timespanType, constants.DEFAULT_DATA_SOURCE, maintopic, configuration.targetBbox,
            configuration.defaultZoomLevel, [], constants.DEFAULT_EXTERNAL_SOURCE, topics.edges.map(populartopic=>populartopic.name), 
            includeCsv, dataSources, category, 
            (err, chartData) => {
                const response = Object.assign({}, chartData, resultUnion, category);

                if (err) {
                    console.error(`initializing dashboard error occured ${err}`);
                    callback(err, response);
                } else {
                    callback(null, response);
                }
            });
    } else {
        callback(null, resultUnion);
    }
}

function isMostPopularTopicSelected(maintopic, popularTopics){
    return popularTopics.length && popularTopics[0].name === maintopic;
}

const methods = {
    initializeDashboard(category) {
        let self = this;
        let dataStore = this.flux.stores.DataStore.dataStore;
        const { timespanType, datetimeSelection } = dataStore;
        const formatter = constants.TIMESPAN_TYPES[timespanType];
        const dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
        const { fromDate, toDate } = dates;

        seqAsync(
            //Load the site settings
            callback => AdminServices.getDashboardSiteDefinition(null, category, (error, response, body) => ResponseHandler(error, response, body, callback)),
            //Load the top 5 most popular terms
            (settings, callback) => fetchCommonTerms(settings, callback, timespanType, fromDate, toDate, category),
            //Merged Results(Settings + Full Term List + Popular Terms)
            (resultUnion, callback) => fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, category, callback)
        )((error, results) => {
            if (!error) {
                self.dispatch(constants.DASHBOARD.INITIALIZE, results);
            } else {
                console.error(`[${error}] occured while fetching edges or site defintion`);
            }
        });
    },
    reloadVisualizationState(fromDate, toDate, datetimeSelection, periodType, dataSource, maintopic, bbox, 
        zoomLevel, conjunctivetopics, externalsourceid, includeCsv, place) {
        let self = this;
        const dataStore = this.flux.stores.DataStore.dataStore;
        const { category, popularTerms, enabledStreams } = dataStore;

        let timeserieslabels = isMostPopularTopicSelected(maintopic, popularTerms) ? popularTerms.map(topic=>topic.name) : [maintopic];

        fetchFullChartData(fromDate, toDate, periodType, dataSource, maintopic, bbox, zoomLevel, conjunctivetopics, externalsourceid, timeserieslabels, includeCsv, enabledStreams, category, (err, chartData) => {
            if (!err) {
                const placeid = place && place.placeid ? place.placeid : "";
                const name = place && place.name ? place.name : "";
                const placecentroid = place && place.placecentroid ? place.placecentroid : [];
                const placebbox = place && place.placebbox ? place.placebbox : [];

                let mutatedFilters = { fromDate, toDate, name, placeid, placebbox, placecentroid, datetimeSelection, periodType, dataSource, maintopic, externalsourceid, zoomLevel, bbox };
                mutatedFilters.selectedconjunctiveterms = conjunctivetopics;

                self.dispatch(constants.DASHBOARD.RELOAD_CHARTS, Object.assign({}, mutatedFilters, chartData));
            } else {
                console.error(`[${err}] occured while processing tile visualization re-sync request`);
            }
        })
    },
    changeLanguage(language) {
        const self = this;

        AdminServices.getWatchlist(language, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data && !body.errors) {
                const { terms } = body.data;

                this.dispatch(constants.DASHBOARD.CHANGE_LANGUAGE, { language, terms });
            } else {
                console.error(error, null);
                self.dispatch(constants.DASHBOARD.LOAD_DETAIL_ERROR, error);
            }
        })
    }
};

module.exports = {
    constants: constants,
    methods: { DASHBOARD: methods }
};