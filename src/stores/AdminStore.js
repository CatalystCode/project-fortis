import Fluxxor from 'fluxxor';
import constants from '../actions/constants';
// eslint-disable-next-line
import ReactDataGridPlugins from 'react-data-grid-addons';

// eslint-disable-next-line
const Filters = window.ReactDataGridPlugins.Filters;

export const AdminStore = Fluxxor.createStore({
    initialize() {
        this.dataStore = {
            streams: [],
            streamGridColumns: [],
            settings: {},
            siteList: [],
            loading: false,
            twitterAccounts: [],
            trustedTwitterAccounts: [],
            termGridColumns: [],
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
            constants.ADMIN.LOAD_STREAMS, this.handleLoadStreams,
            constants.ADMIN.LOAD_KEYWORDS, this.handleLoadTerms,
            constants.ADMIN.LOAD_FB_PAGES, this.handleLoadFacebookPages,
            constants.ADMIN.LOAD_LOCALITIES, this.handleLoadLocalities,
            constants.ADMIN.LOAD_SETTINGS, this.handleLoadSettings,
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

    handleLoadStreams(response) {
      this.dataStore.streams = response.response.streams.streams || [];
      this.dataStore.action = response.action || false;
      this.loadStreamsColumns(this.dataStore.streams);
      this.emit("change");
    },

    loadStreamsColumns() {
      const defaultColumn = {
        editable: true,
        filterable: true,
        resizable: true
      };

      let columns = [];
      columns.push(Object.assign({}, defaultColumn, {editable: false, key: "pipelineKey", name: "Pipeline Key"}));
      columns.push(Object.assign({}, defaultColumn, {editable: false, key: "pipelineLabel", name: "Pipeline Label"}));
      columns.push(Object.assign({}, defaultColumn, {editable: false, key: "streamFactory", name: "Stream Factory"}));
            
      this.dataStore.streamGridColumns = columns;
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

    handleLoadTerms(response){
        this.dataStore.watchlist = response.response;
        this.dataStore.action = response.action || false;
        this.emit("change");
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
        this.dataStore.settings = settings;
        this.dataStore.action = action;
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
        
        this.loadTermColumns(settings.properties.supportedLanguages);
        this.loadLocalitiesColumns(settings.properties.supportedLanguages);
        this.emit("change");
    },

    loadTermColumns(languages){
        const defaultColDef = {
                    editable:true,
                    sortable : true,
                    filterable: true,
                    resizable: true
        };
        let columns = [];
        columns.push(Object.assign({}, defaultColDef, {editable: false, key: "RowKey", name: "Term ID"}));
        languages.forEach(lang => {
            columns.push(Object.assign({}, defaultColDef, {
                                                           compositeKey: true, 
                                                           key: lang !== "en" ? `name_${lang}` : 'name', 
                                                           name: lang !== "en" ? `name_${lang}` : 'name'
                                                          }))
        });
              
        this.dataStore.termGridColumns = columns;
    },

    handleLoadPayloadFail(payload) {
        this.dataStore.error = payload.error;
    }

});