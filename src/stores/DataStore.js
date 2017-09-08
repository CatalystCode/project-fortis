import Fluxxor from 'fluxxor';
import constants from '../actions/constants';
import { momentGetFromToRange } from '../utils/Utils.js';
import moment from 'moment';

const LANGUAGE_CODE_ENG = 'en';

function makeMap(items, keyFunc, valueFunc) {
    let map = new Map();

    items.forEach(item => {
        const key = keyFunc(item);
        const value = valueFunc(item);
        map.set(key, Object.assign({}, (map.get(key) || {}), value));
    });

    return map;
}

function convertDateValueToRange(timeSelection, timeType){
    const formatter = constants.TIMESPAN_TYPES[timeType];
    return momentGetFromToRange(timeSelection, formatter.format, formatter.rangeFormat);
}

export const DataStore = Fluxxor.createStore({
    initialize(profile) {

        this.dataStore = {
            userProfile: profile,
            timespanType: constants.DEFAULT_TIMESPAN_TYPE,
            datetimeSelection: moment().format(constants.DEFAULT_TIMEPERIOD_FORMAT),
            dataSource: constants.DEFAULT_DATA_SOURCE,
            fromDate: false,
            toDate: false,
            settings: {},
            title: "",
            logo: "",
            conjunctivetopics: [],
            externalsourceid: constants.DEFAULT_EXTERNAL_SOURCE,
            placeid: "",
            timeSeriesGraphData: {},
            popularLocations: [],
            targetBbox: [],
            popularTerms: [],
            topSources: [],
            trustedSources: [],
            supportedLanguages: [],
            termFilters: new Set(),
            heatmapTileIds: [],
            fullTermList: new Map(),
            bbox: [],
            zoomLevel: constants.HEATMAP_DEFAULT_ZOOM,
            maintopic: false,
            language: LANGUAGE_CODE_ENG
        }

        this.bindActions(
            constants.DASHBOARD.INITIALIZE, this.intializeSettings,
            constants.DASHBOARD.RELOAD_CHARTS, this.handleReloadChartData,
            constants.DASHBOARD.ASSOCIATED_TERMS, this.mapDataUpdate,
            constants.DASHBOARD.CHANGE_TERM_FILTERS, this.handleChangeTermFilters,
            constants.DASHBOARD.CHANGE_TERM_FILTERS_TO_ONLY, this.handleChangeTermFiltersToOnly,
            constants.DASHBOARD.CHANGE_LANGUAGE, this.handleLanguageChange,
            constants.DASHBOARD.CLEAR_FILTERS, this.handleClearFilters
        );
    },

    getState() {
        return this.dataStore;
    },

    handleLanguageChange(language) {
        this.dataStore.language = language;
        this.emit("change");
    },

    syncChartDataToStore(graphqlResponse){
        const { locations, topics, sources, timeSeries, conjunctiveterms } = graphqlResponse;
        this.dataStore.popularLocations = locations && locations.edges ? locations.edges : [];
        this.dataStore.popularTerms = topics && topics.edges ? topics.edges : [];
        this.dataStore.conjunctivetopics = conjunctiveterms && conjunctiveterms.edges ? conjunctiveterms.edges : [];
        this.dataStore.topSources = sources && sources.edges ? sources.edges : [];
        this.syncTimeSeriesData(timeSeries || []);
    },

    intializeSettings(graphqlResponse) {
        const { terms, configuration, topics, timeSeries } = graphqlResponse;
        const { datetimeSelection, timespanType } = this.dataStore;
        const { defaultLanguage, logo, title, targetBbox, supportedLanguages, defaultZoomLevel } = configuration;
        const { fromDate, toDate } = convertDateValueToRange(datetimeSelection, timespanType);

        this.dataStore.fullTermList = makeMap(terms.edges, term=>term.name, term=>term);
        this.dataStore.title = title;
        this.dataStore.fromDate = fromDate;
        this.dataStore.toDate = toDate;
        this.dataStore.logo = logo;
        this.dataStore.language = defaultLanguage;
        this.dataStore.zoomLevel = defaultZoomLevel;
        this.dataStore.bbox = targetBbox || [];
        this.dataStore.targetBbox = targetBbox;
        this.dataStore.supportedLanguages = supportedLanguages;
        this.dataStore.maintopic = topics.edges.length ? topics.edges[0].name : '';
        this.dataStore.settings = configuration;
        this.syncChartDataToStore(graphqlResponse);

        this.dataStore.termFilters.clear();
        this.emit("change");
    },

    handleChangeTermFilters(newFilters) {
        const filtersToRemove = newFilters.filter(filter => filter.action === 'remove').map(filter => filter.term);
        const newFilterSet = new Set(newFilters.map(filter => filter.term));
        //merge the earlier filters with the newly added selections
        this.dataStore.termFilters = new Set([...this.dataStore.termFilters, ...newFilterSet].filter(filter => filtersToRemove.indexOf(filter) === -1));
        this.emit("change");
    },

    handleChangeTermFiltersToOnly(newFilter) {
        this.dataStore.termFilters = new Set(newFilter);
        this.emit("change");
    },

    syncDatetimeState(datetimeSelection, timespanType) {
        this.dataStore.datetimeSelection = datetimeSelection;
        this.dataStore.timespanType = timespanType;
    },

    syncTimeSeriesData(mutatedTimeSeries) {
        this.dataStore.timeSeriesGraphData = { labels: [], graphData: [] };
        this.dataStore.heatmapTileIds = [];

        let test = [{ "date": "2017-08-30 17:00", "isis": 1, "bomb": 23, "car": 2, "fatalities": 2, "fear": 1 },
        { "date": "2017-09-01 17:00", "isis": 1, "bomb": 15, "car": 2, "fatalities": 2, "fear": 1 },
        { "date": "2017-09-02 17:00", "isis": 1, "bomb": 23, "car": 2, "fatalities": 2, "fear": 1 }
        ];

        if (mutatedTimeSeries && mutatedTimeSeries.graphData && mutatedTimeSeries.labels && mutatedTimeSeries.graphData.length) {
            const { labels, graphData, tiles } = mutatedTimeSeries;
            this.dataStore.timeSeriesGraphData = Object.assign({}, { labels });
            
            const timeseriesMap = makeMap(graphData, item=>item.date, item=>{
                let timeSeriesEntry = {date: item.date};
                timeSeriesEntry[item.name] = item.mentions;

                return timeSeriesEntry;
            });

            let sorted = Array.from(timeseriesMap.values()).concat(test).sort((a, b)=>moment(a.date).unix() > moment(b.date).unix());
            this.dataStore.timeSeriesGraphData.graphData = sorted;
            this.dataStore.heatmapTileIds = tiles;
        }
    },

    syncFilterSelections(mutatedFilters){
        const { fromDate, toDate, periodType, zoomLevel, dataSource, datetimeSelection, maintopic, externalsourceid, selectedconjunctiveterms } = mutatedFilters;

        this.dataStore.fromDate = fromDate;
        this.dataStore.toDate = toDate;
        this.dataStore.timespanType = periodType;
        this.dataStore.dataSource = dataSource;
        this.dataStore.maintopic = maintopic;
        this.dataStore.datetimeSelection = datetimeSelection;
        this.dataStore.zoomLevel = zoomLevel;
        this.dataStore.externalsourceid = externalsourceid;
        this.dataStore.termFilters = new Set(selectedconjunctiveterms);
    },

    handleClearFilters() {
        this.dataStore.termFilters.clear();
        this.emit("change");
    },

    handleReloadChartData(changedData) {
        this.syncChartDataToStore(changedData);
        this.syncFilterSelections(changedData);
        this.emit("change");
    },

    mapDataUpdate(heatmapData) {
        this.dataStore.associatedKeywords = new Map();
        this.dataStore.associatedKeywords = heatmapData.associatedKeywords;
        this.dataStore.bbox = heatmapData.bbox;
        this.dataStore.zoomLevel = heatmapData.zoomLevel;
        this.emit("change");
    }
});