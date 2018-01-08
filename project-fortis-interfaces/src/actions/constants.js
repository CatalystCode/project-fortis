const SENTIMENT_JSON_MAPPING = {
    "0": -5,
    "-1": -15,
    "1": 5
};

const MAP = {
    MINZOOM: 8,
    MAXZOOM: 8,
    DEBOUNCE: 3000
};

const TIMESPAN_TYPES = {
    'hour': {
        format: "MM/DD/YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour", timeseriesType: "hour"
    },
    'day': {
        format: "MM/DD/YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day", timeseriesType: "hour"
    },
    'month': {
        format: "YYYY-MM", blobFormat: "[month]-YYYY-MM", rangeFormat: "month", timeseriesType: "hour"
    },
    'week': {
        format: "YYYY.ww", blobFormat: "[week]-YYYY-WW", rangeFormat: "week", timeseriesType: "hour"
    },
    'year': {
        format: "YYYY", blobFormat: "[year]-YYYY", rangeFormat: "year", timeseriesType: "day"
    },
    'customDate': {
        format: "MM/DD/YYYY", reactWidgetFormat: "MMM Do YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day", timeseriesType: "hour"
    },
    'customDateTime': {
        format: "MM/DD/YY HH:00", reactWidgetFormat: "MMM Do YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
    },
    'customMonth': {
        format: "MMMM YYYY", reactWidgetFormat: "MMMM YYYY", blobFormat: "[month]-YYYY-MM", rangeFormat: "month", timeseriesType: "hour"
    }
};

const MOMENT_FORMATS = {
    "timeScaleDate": "MM/DD/YY HH:00"
};

const LANGUAGE_CODE_ENG = "en";

const CHART_STYLE = {
    BG_FILL: "#30303d",
    COLORS: ['#CD0D74', '#8A0CCF', '#2A0CD0', '#0D52D1', '#0D8ECF', '#04D215', '#B0DE09', '#448e4d', '#754DEB', '#FF9E01', '#FF6600', '#FF0F00']
};

const EVENT_SOURCE_ICON_MAP = {
    "twitter": "fa fa-twitter",
    "facebook": "fa fa-facebook-official"
};

const CATEGORY_KEY_MAPPING = {
    'kw': 'keyword',
    'g': 'group',
    'sec': 'sector',
    'st': 'status'
};

const DEFAULT_TIMESERIES_PERIOD = "hour";
const DEFAULT_DATA_SOURCE = "all";
const PIPELINE_ALL = "all";
const PIPELINE_CUSTOM = "custom";
const DEFAULT_EXTERNAL_SOURCE = "all";
const DEFAULT_TIMESPAN_TYPE = "week";
const DEFAULT_TIMEPERIOD_FORMAT = "YYYY-ww";

const ACTIVITY_FEED = {
    NEWS_FEED_SEARCH_CONTAINER_HEIGHT: 115,
    SERVICE_DATETIME_FORMAT: "MM/DD/YYYY HH:mm:s A",
    ELEMENT_ITEM_HEIGHT: 80,
    OFFSET_INCREMENT: 90,
    INFINITE_LOAD_DELAY_MS: 1800
};

const ANNUAL_TIMESERIES_PERIOD = "day";
const HEATMAP_MAX_ZOOM = 16;
const HEATMAP_DEFAULT_ZOOM = 8;

const APP = {
    CHANGE_LANGUAGE: "APP:CHANGE_LANGUAGE",
};

const DASHBOARD = {
    INITIALIZE: "DASHBOARD:INIT",
    INITIALIZE_PROGRESS: "DASHBOARD:INIT_PROGRESS",
    RELOAD_CHARTS: "RELOAD:RELOAD_CHARTS",
    CHANGE_LANGUAGE: "DASHBOARD:CHANGE_LANGUAGE",
    LOAD_DETAIL_ERROR: "LOAD:DETAIL_ERROR",
    AUTH_USER: "AUTH:USER",
    LOAD_TRUSTED_SOURCES:"RELOAD:TRUSTED_SOURCES",
};

const FACTS = {
    LOAD_FACTS_SUCCESS: "LOAD:FACTS_SUCCESS",
    LOAD_FACTS_FAIL: "LOAD:FACTS_FAIL",
    LOAD_TAGS: "LOAD:TAGS",
    INITIALIZE: "FACTS:INIT",
    SAVE_PAGE_STATE: "SAVE:PAGE_STATE",
    CHANGE_LANGUAGE: "FACTS:CHANGE_LANGUAGE",
};

const ADMIN = {
    RESTART_PIPELINE: "RESTART_PIPELINE",
    LOAD_SITE_SETTINGS: "LOAD:SITE_SETTINGS",
    SAVE_SITE_SETTINGS: "SAVE:SITE_SETTINGS",
    LOAD_STREAMS: "LOAD:STREAMS",
    MODIFY_STREAMS: "MODIFY:STREAMS",
    LOAD_TOPICS: "LOAD:TOPICS",
    LOAD_TRUSTED_SOURCES:"LOAD:TRUSTED_SOURCES",
    LOAD_BLACKLIST: "LOAD:BLACKLIST",
    LOAD_PLACES: "LOAD:PLACES",
    SAVE_TWITTER_ACCOUNTS: "SAVE:TWITTER_ACCOUNTS",
    LOAD_TWITTER_ACCOUNTS: "LOAD:TWITTER_ACCOUNTS",
    SAVE_TRUSTED_TWITTER_ACCTS: "SAVE:TRUSTED_TWITTER_ACCTS",
    LOAD_TRUSTED_TWITTER_ACCTS: "LOAD:TRUSTED_TWITTER_ACCTS",
    PUBLISHED_EVENTS: "SAVE:EVENT_PUBLISH",
    LOAD_FAIL: "LOAD:FAIL",
    REMOVE_FAIL: "REMOVE:FAIL"
};

module.exports = {
    SENTIMENT_JSON_MAPPING,
    MAP,
    TIMESPAN_TYPES,
    MOMENT_FORMATS,
    LANGUAGE_CODE_ENG,
    CHART_STYLE,
    EVENT_SOURCE_ICON_MAP,
    CATEGORY_KEY_MAPPING,
    DEFAULT_TIMESERIES_PERIOD,
    DEFAULT_DATA_SOURCE,
    PIPELINE_ALL,
    PIPELINE_CUSTOM,
    DEFAULT_EXTERNAL_SOURCE,
    DEFAULT_TIMESPAN_TYPE,
    DEFAULT_TIMEPERIOD_FORMAT,
    ACTIVITY_FEED,
    ANNUAL_TIMESERIES_PERIOD,
    HEATMAP_MAX_ZOOM,
    HEATMAP_DEFAULT_ZOOM,
    APP,
    DASHBOARD,
    FACTS,
    ADMIN
};
