module.exports = {
    SENTIMENT_JSON_MAPPING : {
         "0": -5,
         "-1": -15,
         "1": 5
    },
    MAP: {
        MINZOOM: 8,
        MAXZOOM: 10,

    },
    TIMESPAN_TYPES : {
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
             format: "YYYY-WW", blobFormat: "[week]-YYYY-WW", rangeFormat: "week", timeseriesType: "hour"
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
    },
    DATA_SOURCES: new Map([["all", {"display": "All", "sourceValues":["Twitter", "Facebook", "acled", "reddit", "Bing"], "icon": "fa fa-share-alt", "label": "All"}],
                     ["Facebook", {"display": "Facebook", "sourceValues":["Facebook"], "icon": "fa fa-facebook-official", "label": ""}],
                     ["Twitter", {"display": "Twitter", "sourceValues":["Twitter"], "label": "", "icon": "fa fa-twitter"}],
                     ["acled", {"display": "acled", "sourceValues":["acled"], "label": "", "icon": "fa fa-font"}],
                     ["TadaWeb", {"display": "Tadaweb", "sourceValues":["TadaWeb"], "label": "", "icon": "fa fa-text-width"}],
                     ["custom", {"display": "Imported Events", "sourceValues":["custom"], "label": "", "icon": "fa fa-upload"}]
                   ]),
    MOMENT_FORMATS: {
        "timeScaleDate": "MM/DD/YY HH:00"
    },
    CHART_STYLE: {
        BG_FILL: "#30303d",
        COLORS: ['#CD0D74', '#2f4074', '#7e6596', '#fdd400', '#84b761', '#b6d2ff']
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
    DEFAULT_TIMESERIES_PERIOD: "hour",
    DEFAULT_DATA_SOURCE: "all",
    DEFAULT_EXTERNAL_SOURCE: "all",
    DEFAULT_TIMESPAN_TYPE: "month",
    DEFAULT_TIMEPERIOD_FORMAT: "YYYY-MM",
    ACTIVITY_FEED: {
        NEWS_FEED_SEARCH_CONTAINER_HEIGHT: 115,
        SERVICE_DATETIME_FORMAT: "MM/DD/YYYY HH:mm:s A",
        ELEMENT_ITEM_HEIGHT: 80,
        OFFSET_INCREMENT: 60,
        INFINITE_LOAD_DELAY_MS: 1800
    },    
    ANNUAL_TIMESERIES_PERIOD: "day",
    HEATMAP_MAX_ZOOM: 16,
    HEATMAP_DEFAULT_ZOOM: 8,
    APP : {
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
        LOAD_SITE_SETTINGS: "LOAD:SITE_SETTINGS",
        SAVE_SITE_SETTINGS: "SAVE:SITE_SETTINGS",
        LOAD_STREAMS: "LOAD:STREAMS",
        MODIFY_STREAMS: "MODIFY:STREAMS",
        REMOVE_STREAMS: "REMOVE:STREAMS",
        LOAD_KEYWORDS: "LOAD:KEYWORDS",
        LOAD_BLACKLIST: "LOAD:BLACKLIST",
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
        REMOVE_FAIL: "REMOVE:FAIL"
    }
};