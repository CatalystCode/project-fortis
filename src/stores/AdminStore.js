import Fluxxor from 'fluxxor';
import constants from '../actions/constants';
// eslint-disable-next-line
import ReactDataGridPlugins from 'react-data-grid-addons';
import { StreamParamsButtonFormatter } from '../components/Admin/StreamParamsButtonFormatter';
import { StreamStatusButtonFormatter } from '../components/Admin/StreamStatusButtonFormatter';

// eslint-disable-next-line
const Filters = window.ReactDataGridPlugins.Filters;

const DEFAULT_COLUMN = {
  editable: false,
  filterable: false,
  resizable: true
};

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

    loadColumns(columnValues, saveAsColumnName) {
      let columns = [];
      columnValues.forEach(value => {
        columns.push(Object.assign({}, DEFAULT_COLUMN, value));
      });

      this.dataStore[saveAsColumnName] = columns;
    },

    handleLoadSiteSettings(response) {
      this.dataStore.settings = response || [];
      this.dataStore.action = response.action || false;
      this.emit("change");
    },

    handleLoadStreams(response) {
      this.dataStore.streams = response.response.streams.streams || [];
      this.dataStore.action = response.action || false;

      this.loadStreamsColumns();
      this.loadStreamParamsColumns();

      this.emit("change");
    },

    loadStreamsColumns() {
      const columnValues = [
        {key: "status", name: "Status", formatter: StreamStatusButtonFormatter, getRowMetaData: (row) => row, width: 90},
        {key: "streamId", name: "Stream Id"},
        {key: "pipelineKey", name: "Pipeline Key"},
        {key: "pipelineLabel", name: "Pipeline Label"},
        {key: "pipelineIcon", name: "Pipeline Icon"},
        {key: "streamFactory", name: "Stream Factory"},
        {key: "params", name: "Params", formatter: StreamParamsButtonFormatter, getRowMetaData: (row) => row, width: 70}
      ];
      const saveAsColumnName = 'streamGridColumns';

      this.loadColumns(columnValues, saveAsColumnName);
    },

    loadStreamParamsColumns() {
      const columnValues = [
        {editable: false, key: "key", name: "key"},
        {editable: true, key: "value", name: "value"}
      ];
      const saveAsColumnName = 'streamParamGridColumns';

      this.loadColumns(columnValues, saveAsColumnName);
    },

    handleModifyStreams(response) {
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
    },

    handleRemoveStreams(response) {
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
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
        this.loadTopicColumns(this.dataStore.settings.properties.supportedLanguages);
        this.emit("change");
    },

    loadTopicColumns(languages) {
      const defaultLanguage = this.dataStore.settings.properties.defaultLanguage;
      const supportedLanguages = this.dataStore.settings.properties.supportedLanguages;
      const columnValues = [
        {key: "topicid", name: "Topic Id"},
        {key: "name", name: defaultLanguage}
      ];
      const saveAsColumnName = 'topicGridColumns';

      languages.forEach(lang => {
        if (lang !== defaultLanguage) {
          columnValues.push({
            key: "translatedname",
            name: lang
          })
        }
      });

      this.loadColumns(columnValues, saveAsColumnName);
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