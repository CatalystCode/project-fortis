import { SERVICES as DashboardServices } from '../../services/Dashboard';
import { SERVICES as AdminServices } from '../../services/Admin';
import seqAsync from 'async/seq';
import constants from '../constants';
import { ResponseHandler } from '../shared';
import { momentGetFromToRange } from '../../utils/Utils';

function fetchCommonTerms(settings, callback, timespanType, fromDate, toDate) {
    let { configuration, terms } = settings;
    configuration = configuration.site.properties;

    DashboardServices.getCommonTerms(timespanType, fromDate, toDate, configuration.targetBbox, configuration.defaultZoomLevel,
        (error, response, body) => ResponseHandler(error, response, body, (err, topics) => {
            if (!err) {
                callback(null, Object.assign({}, { terms }, { configuration }, topics ));
            } else {
                callback(err, null);
            }
        }));
}

function fetchFullChartData(fromDate, toDate, periodType, dataSource, maintopic,
    bbox, zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, includeCsv, callback) {

    DashboardServices.getChartVisualizationData(periodType, maintopic, dataSource, fromDate, toDate, 
        bbox, zoomLevel, conjunctivetopics, externalsourceid, timeseriesmaintopics, !!includeCsv,
        (err, response, body) => ResponseHandler(err, response, body, callback));
}

function fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, callback) {
    const { configuration, topics } = resultUnion;

    if (topics.edges.length) {
        const includeCsv = false;
        const maintopic = topics.edges[0].name;//grab the most commonly mentioned term
        //we're defaulting the timeseriesmaintopics to the most popular on the initial load so we can show all in the timeseries
        fetchFullChartData(fromDate, toDate, timespanType, constants.DEFAULT_DATA_SOURCE, maintopic, configuration.targetBbox,
            configuration.defaultZoomLevel, [], constants.DEFAULT_EXTERNAL_SOURCE, topics.edges.map(populartopic=>populartopic.name), includeCsv,
            (err, chartData) => {
                const response = Object.assign({}, chartData, resultUnion);

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
    initializeDashboard() {
        let self = this;
        let dataStore = this.flux.stores.DataStore.dataStore;
        const { timespanType, datetimeSelection } = dataStore;
        const formatter = constants.TIMESPAN_TYPES[timespanType];
        const dates = momentGetFromToRange(datetimeSelection, formatter.format, formatter.rangeFormat);
        const { fromDate, toDate } = dates;

        seqAsync(
            //Load the site settings
            callback => AdminServices.getDashboardSiteDefinition(null, (error, response, body) => ResponseHandler(error, response, body, callback)),
            //Load the top 5 most popular terms
            (settings, callback) => fetchCommonTerms(settings, callback, timespanType, fromDate, toDate),
            //Merged Results(Settings + Full Term List + Popular Terms)
            (resultUnion, callback) => fetchInitialChartDataCB(resultUnion, fromDate, toDate, timespanType, callback)
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

        let timeserieslabels = isMostPopularTopicSelected(maintopic, dataStore.popularTerms) ? dataStore.popularTerms.map(topic=>topic.name) : [maintopic];

        fetchFullChartData(fromDate, toDate, periodType, dataSource, maintopic, bbox, zoomLevel, conjunctivetopics, externalsourceid, timeserieslabels, includeCsv, (err, chartData) => {
            if (!err) {
                const placeid = place && place.placeid ? place.placeid : "";
                const name = place && place.name ? place.name : "";
                const placecentroid = place && place.placecentroid ? place.placecentroid : [];

                let mutatedFilters = { fromDate, toDate, name, placeid, placecentroid, datetimeSelection, periodType, dataSource, maintopic, externalsourceid, zoomLevel, bbox };
                mutatedFilters.selectedconjunctiveterms = conjunctivetopics;

                self.dispatch(constants.DASHBOARD.RELOAD_CHARTS, Object.assign({}, mutatedFilters, chartData));
            } else {
                console.error(`[${err}] occured while processing tile visualization re-sync request`);
            }
        })
    },
    loadDetail(siteKey, messageId, dataSources, sourcePropeties) {
        let self = this;
        DashboardServices.FetchMessageDetail(siteKey, messageId, dataSources, sourcePropeties, (error, response, body) => {
            if (!error && response.statusCode === 200 && body.data) {
                const data = body.data;
                self.dispatch(constants.DASHBOARD.LOAD_DETAIL, data);
            } else {
                console.error(`[${error}] occured while processing message request`);
                self.dispatch(constants.DASHBOARD.LOAD_DETAIL_ERROR, error);
            }
        });
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