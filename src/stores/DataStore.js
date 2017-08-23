import Fluxxor from 'fluxxor';
import {Actions} from '../actions/Actions';
import moment from 'moment';

const LANGUAGE_CODE_ENG='en';

export const DataStore = Fluxxor.createStore({
    initialize(profile) {
      
      this.dataStore = {
          userProfile: profile,
          timespanType: 'month',
          datetimeSelection: moment().format("YYYY-MM"),
          categoryType: '',
          dataSource: 'all',
          fromDateRange: false,
          toDateRange: false,
          settings: {},
          siteKey: '',
          associatedKeywords: new Map(),
          timeSeriesGraphData: {},
          popularLocations: [],
          popularTerms: [],
          topSources: [],
          trustedSources: [],
          originalSource: '',
          termFilters: new Set(),
          allEdges: new Map(),
          bbox: [],
          zoomLevel: 8,
          colorMap: new Map(),
          selectedLocationCoordinates: [],
          categoryValue: false,
          language: 'en'
      }
      
      this.bindActions(
            Actions.constants.DASHBOARD.INITIALIZE, this.intializeSettings,
            Actions.constants.DASHBOARD.RELOAD_TOP_SOURCES, this.syncTopSources,
            Actions.constants.DASHBOARD.RELOAD_CHARTS, this.handleReloadChartData,
            Actions.constants.DASHBOARD.ASSOCIATED_TERMS, this.mapDataUpdate,
            Actions.constants.DASHBOARD.CHANGE_TERM_FILTERS, this.handleChangeTermFilters,
            Actions.constants.DASHBOARD.CHANGE_TERM_FILTERS_TO_ONLY, this.handleChangeTermFiltersToOnly,
            Actions.constants.DASHBOARD.CHANGE_LANGUAGE, this.handleLanguageChange,
            Actions.constants.DASHBOARD.RELOAD_SOURCES, this.reloadTopSources,
            Actions.constants.DASHBOARD.CLEAR_FILTERS, this.handleClearFilters
      );
    },

    getState() {
        return this.dataStore;
    },

    handleLanguageChange(language){
        this.dataStore.language = language;
        this.emit("change");
    },

    intializeSettings(graphqlResponse){
            if(graphqlResponse.settings.siteDefinition.sites && graphqlResponse.edges){
                this.dataStore.allEdges = new Map();
                const {locations, terms} = graphqlResponse.edges;
                const fullEdgeList = locations.edges.concat(terms.edges);
                const settings = graphqlResponse.settings.siteDefinition.sites[0];
                const languages = settings.properties.supportedLanguages || ['en'];

                this.dataStore.trustedSources = graphqlResponse.trustedSources.accounts;

                fullEdgeList.forEach(edge=>{
                    languages.forEach(language=>{
                        let languageMap = this.dataStore.allEdges.get(language);
                        if(!languageMap){
                            languageMap = new Map();
                        }
                        
                        const objectKey = language === LANGUAGE_CODE_ENG ? 'name' : `name_${language}`;
                        const defaultEdgeDefintion = Object.assign({}, edge, {name_en: edge.name.toLowerCase(), name: edge.name.toLowerCase()});
                        const edgeTranslations = Object.assign({}, (languageMap.get(edge[objectKey].toLowerCase()) || defaultEdgeDefintion));

                        languageMap.set(edge[objectKey].toLowerCase(), edgeTranslations);

                        this.dataStore.allEdges.set(language, languageMap);
                    });
                });

                this.dataStore.settings = settings;
                this.dataStore.dataSource = graphqlResponse.dataSource;
                this.syncTimeSeriesData(graphqlResponse.timeSeries);
                //set the initial primary term to the most popular.
                if(graphqlResponse.timeSeries.labels && graphqlResponse.timeSeries.labels.length > 0){
                    this.syncPrimaryEdgeData(this.dataStore.allEdges.get(LANGUAGE_CODE_ENG).get(graphqlResponse.timeSeries.labels[0].name), LANGUAGE_CODE_ENG);
                }
                
                this.syncPopularTerms(graphqlResponse.timeSeries.labels || []);
                this.dataStore.popularLocations = graphqlResponse.locations.edges;
            }else{
                console.error('Required data is not available');
            }

            this.emit("change");
    },

    syncAssociatedTermsSelections(filterSet){
        for (let [term, value] of this.dataStore.associatedKeywords.entries()) {
                value.enabled = filterSet.has(term);
        }
    },
    
    handleChangeTermFilters(newFilters){
        const filtersToRemove = newFilters.filter(filter=>filter.action === 'remove').map(filter=>filter.term);
        const newFilterSet = new Set(newFilters.map(filter=>filter.term));
        //merge the earlier filters with the newly added selections
        this.dataStore.termFilters = new Set([...this.dataStore.termFilters, ...newFilterSet].filter(filter=>filtersToRemove.indexOf(filter) === -1));
        this.syncAssociatedTermsSelections(this.dataStore.termFilters);
        this.emit("change");
    },

    handleChangeTermFiltersToOnly(newFilter){
        this.dataStore.termFilters = new Set(newFilter);
        this.syncAssociatedTermsSelections(this.dataStore.termFilters);
        this.emit("change");
    },

    syncPrimaryEdgeData(selectedEntity, language){
        let edgeMap = this.dataStore.allEdges.get(language);
        //If the primary edge has changed then clear the filtered terms. 
        if(this.dataStore.categoryValue.name && this.dataStore.categoryValue.name !== selectedEntity.name){
            this.dataStore.termFilters.clear();
        }

        if(selectedEntity){
            this.dataStore.categoryValue = edgeMap.get(selectedEntity[`name_${language}`]);
            this.dataStore.selectedLocationCoordinates = selectedEntity.coordinates || [];
            this.dataStore.categoryType = selectedEntity.type;
        }
    },

    syncDatetimeState(datetimeSelection, timespanType){
        this.dataStore.datetimeSelection = datetimeSelection;
        this.dataStore.timespanType = timespanType;
    },

    syncTimeSeriesData(mutatedTimeSeries){
        this.dataStore.timeSeriesGraphData = {labels: [], graphData: []};

        if(mutatedTimeSeries && mutatedTimeSeries.graphData && mutatedTimeSeries.labels && mutatedTimeSeries.graphData.length > 0){
            this.dataStore.timeSeriesGraphData = Object.assign({}, {labels: mutatedTimeSeries.labels});
            this.dataStore.timeSeriesGraphData.graphData = mutatedTimeSeries.graphData.map(hourlyAggregate => {
                let graphEntry = Object.assign({}, {date: hourlyAggregate.date});
                hourlyAggregate.edges.forEach((edge, index) => {
                    graphEntry[edge] = hourlyAggregate.mentions[index];
                });

                return graphEntry;
            });
        }
    },

    syncPopularTerms(popularTerms){
        let colorSlices = ['#fdd400', '#84b761', '#b6d2ff', '#CD0D74', '#2f4074', '#7e6596'];
        this.dataStore.colorMap.clear();
        this.dataStore.popularTerms = popularTerms;
        this.dataStore.popularTerms.forEach(term=>{
            this.dataStore.colorMap.set(term.name, colorSlices.pop());
        });
    },

    syncTopSources(topSources){
        if(topSources && topSources.sources){
            this.dataStore.topSources = topSources.sources;
        }
    },

    reloadTopSources(topSources){
        this.syncTopSources(topSources);
        this.emit("change");
    },

    handleClearFilters(){
        this.dataStore.termFilters.clear();
        this.syncAssociatedTermsSelections(this.dataStore.termFilters);
        this.emit("change");
    },

    handleReloadChartData(changedData){
        const {selectedEntity, datetimeSelection, timespanType, 
               mutatedTimeSeries, popularLocations, popularTerms, dataSource, topSources} = changedData;

        if(selectedEntity.type === "Source")
        {
            this.dataStore.originalSource = selectedEntity.name;
        }
        else
        {
            this.dataStore.originalSource = '';
            this.syncPrimaryEdgeData(selectedEntity, this.dataStore.language);
            this.syncDatetimeState(datetimeSelection, timespanType);
            this.syncTimeSeriesData(mutatedTimeSeries);
            this.syncTopSources(topSources);
            this.dataStore.dataSource = dataSource;
            this.syncPopularTerms(popularTerms || []);
            this.dataStore.popularLocations = popularLocations.edges || [];
        }

        this.emit("change");
    },
    
    mapDataUpdate(heatmapData){
        this.dataStore.associatedKeywords = new Map();
        this.dataStore.associatedKeywords = heatmapData.associatedKeywords;
        this.syncAssociatedTermsSelections(this.dataStore.termFilters);
        this.dataStore.bbox = heatmapData.bbox;
        this.dataStore.zoomLevel = heatmapData.zoomLevel;
        this.emit("change");
    }
});