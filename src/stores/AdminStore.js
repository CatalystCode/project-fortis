import Fluxxor from 'fluxxor';
import constants from '../actions/constants';
// eslint-disable-next-line
import ReactDataGridPlugins from 'react-data-grid-addons';
import { StreamParamsButtonFormatter } from '../components/Admin/StreamParamsButtonFormatter';
import { StreamStatusButtonFormatter } from '../components/Admin/StreamStatusButtonFormatter';

// eslint-disable-next-line
const Filters = window.ReactDataGridPlugins.Filters;

export const AdminStore = Fluxxor.createStore({
    initialize() {
        this.dataStore = {
            streams: [],
            streamGridColumns: [],
            streamParamGridColumns: [],
            settings: {},
            siteList: [],
            loading: false,
            twitterAccounts: [],
            trustedTwitterAccounts: [],
            topicGridColumns: [],
            facebookPages: [],
            osmPlaceGroups: new Map(),
            blacklist: [],
            locationGridColumns: [],
            locations: new Map(),
            watchlist: [],
            action: false,
            error: null
        };

        this.bindActions(
            constants.ADMIN.LOAD_SITE_SETTINGS, this.handleLoadSiteSettings,
            constants.ADMIN.LOAD_STREAMS, this.handleLoadStreams,
            constants.ADMIN.MODIFY_STREAMS, this.handleModifyStreams,
            constants.ADMIN.REMOVE_STREAMS, this.handleRemoveStreams,
            constants.ADMIN.LOAD_TOPICS, this.handleLoadTopics,
            constants.ADMIN.LOAD_FB_PAGES, this.handleLoadFacebookPages,
            constants.ADMIN.LOAD_LOCALITIES, this.handleLoadLocalities,
            constants.ADMIN.LOAD_TWITTER_ACCTS, this.handleLoadTwitterAccts,
            constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, this.handleLoadTrustedTwitterAccts,
            constants.ADMIN.LOAD_FAIL, this.handleLoadPayloadFail,
            constants.ADMIN.CREATE_SITE, this.handleCreateSite,
            constants.ADMIN.LOAD_BLACKLIST, this.handleLoadBlacklist,
            constants.ADMIN.PUBLISHED_EVENTS, this.handlePublishedCustomEvents
        );
    },

    getState() {
        return this.dataStore;
    },

    handleLoadSiteSettings(response) {
      this.dataStore.settings = response || [];
      this.dataStore.action = response.action || false;
      this.emit("change");
    },

    handleLoadStreams(response) {
      this.dataStore.streams = response.response.streams.streams || [];
      this.dataStore.action = response.action || false;
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
    },

    handleModifyStreams(response) {
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
    },

    handleRemoveStreams(response) {
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
    },

    loadStreamsColumns() {
      const defaultColumn = {
        editable: false,
        filterable: false,
        resizable: true
      };

      let columns = [];
      columns.push(Object.assign({}, defaultColumn, {key: "status", name: "Status", formatter: StreamStatusButtonFormatter, getRowMetaData: (row) => row, width: 90}));
      columns.push(Object.assign({}, defaultColumn, {key: "streamId", name: "Stream Id"}));
      columns.push(Object.assign({}, defaultColumn, {key: "pipelineKey", name: "Pipeline Key"}));
      columns.push(Object.assign({}, defaultColumn, {key: "pipelineLabel", name: "Pipeline Label"}));
      columns.push(Object.assign({}, defaultColumn, {key: "pipelineIcon", name: "Pipeline Icon"}));
      columns.push(Object.assign({}, defaultColumn, {key: "streamFactory", name: "Stream Factory"}));
      columns.push(Object.assign({}, defaultColumn, {key: "params", name: "Params", formatter: StreamParamsButtonFormatter, getRowMetaData: (row) => row, width: 70}));

      this.dataStore.streamGridColumns = columns;

      let paramColumns = [];
      paramColumns.push(Object.assign({}, defaultColumn, {editable: false, key: "key", name: "key"}));
      paramColumns.push(Object.assign({}, defaultColumn, {editable: true, key: "value", name: "value"}));
      this.dataStore.streamParamGridColumns = paramColumns;
    },

    handleLoadPayload(payload) {
        this.dataStore.settings = Object.assign(this.dataStore.settings, payload);
        this.emit("change");
    },

    handleLoadTwitterAccts(response){
        this.dataStore.twitterAccounts = response.streams.accounts;
        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handleLoadTrustedTwitterAccts(response){
        this.dataStore.trustedTwitterAccounts = response.accounts.accounts || [];
        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handleLoadFacebookPages(response){
        this.dataStore.facebookPages = response.pages.pages || [];
        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handleLoadBlacklist(response){
        if(response.filters.filters){
            this.dataStore.blacklist = response.filters.filters.map(filter=>Object.assign({}, filter, {filteredTerms: JSON.stringify(filter.filteredTerms)}));
        }
        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handleLoadTopics(response){
        this.dataStore.watchlist = response.response || [];
        this.dataStore.action = response.action || false;
        this.loadTopicGridColumns(this.dataStore.settings.properties.supportedLanguages);
        this.emit("change");
    },

    loadTopicGridColumns(languages) {
      const defaultColDef = {
        editable: false,
        sortable: false,
        filterable: false,
        resizable: true
      };
      let columns = [];

      const defaultLanguage = this.dataStore.settings.properties.defaultLanguage;
      const supportedLanguages = this.dataStore.settings.properties.supportedLanguages;

      columns.push(Object.assign({}, defaultColDef, {key: "topicid", name: "Topic Id"}));
      columns.push(Object.assign({}, defaultColDef, {key: "name", name: defaultLanguage}));
      languages.forEach(lang => {
        if (lang !== defaultLanguage) {
          columns.push(Object.assign({}, defaultColDef, {
            key: "translatedname",
            name: lang
          }))
        }
      });
            
      this.dataStore.topicGridColumns = columns;
    },

    handleLoadLocalities(response){
        this.dataStore.locations.clear();
        response.response.forEach(location => {
            this.dataStore.locations.set(location.name.toLowerCase(), Object.assign({}, location, {coordinates: location.coordinates.join(",")}));
        });

        if(response.mutatedSiteDefintion && response.mutatedSiteDefintion.name){
            this.dataStore.settings.properties.targetBbox = response.mutatedSiteDefintion.targetBbox;
        }

        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handlePublishedCustomEvents(response){
        this.dataStore.action = response.action || false;
        this.emit("change");
    },

    handleCreateSite(response){
        const {siteName, action} = response;
        this.dataStore.siteList.push({name: siteName});
        this.dataStore.action = action;
        this.emit("change");
    },

    handleLoadSettings(response){
        const {settings, action, siteList, originalSiteName} = response;
        this.dataStore.settings = response;
        this.dataStore.action = response.action || false;
        if(!siteList){
            this.dataStore.siteList = this.dataStore.siteList.map(site => {
                if(site.name === originalSiteName){
                    return Object.assign({}, site, {name: settings.name});
                }else{
                    return site;
                }
            });
        }else{
            this.dataStore.siteList = siteList;
        }
        
        this.loadLocalitiesColumns(settings.properties.supportedLanguages);
        this.emit("change");
    },

    handleLoadPayloadFail(payload) {
        this.dataStore.error = payload.error;
    }

});