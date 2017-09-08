import Fluxxor from 'fluxxor';
import constants from '../actions/constants';

export const FactsStore = Fluxxor.createStore({
  initialize() {
    this.dataStore = {
      facts: [],
      tags: [],
      selectedTags: [],
      error: null,
      loaded: false,
      skip: 0,
      pageSize: 50,
      pageState: {},
      settings: {},
      language:'en'
    };

    this.bindActions(
      constants.APP.CHANGE_LANGUAGE, this.handleLanguageChange,
      constants.FACTS.INITIALIZE, this.intializeSettings,
      constants.FACTS.LOAD_FACTS_SUCCESS, this.handleLoadFactsSuccess,
      constants.FACTS.LOAD_FACTS_FAIL, this.handleLoadFactsFail,
      constants.FACTS.LOAD_TAGS, this.handleLoadTags,
      constants.FACTS.SAVE_PAGE_STATE, this.handleSavePageState,
    );
  },

  getState() {
    return this.dataStore;
  },

  handleLanguageChange(language){
      this.dataStore.language = language;
      this.emit("change");
  },

  handleLoadFactsSuccess(payload) {
    this.dataStore.loaded = true;
    this.dataStore.error = null;
    this.dataStore.facts = this._processResults(payload.response);
    this._incrementSkip(this.dataStore.facts);
    this.emit("change");
  },

  handleLoadTags(payload) {
    if(payload.terms && payload.terms.edges){
      this.dataStore.tags = payload.terms.edges;
      this.emit("change");
    }
  },

  intializeSettings(siteSettings){
    this.dataStore.settings = siteSettings;
    this.emit("change");
  },

  _processResults(results) {
    let facts = results.byEdges.features;
    return this.dataStore.facts.concat(facts);
  },

  _incrementSkip(results) {
    // Total no. of items in each new section should be equal to page size...
    var count = results.length;
    if (count === this.dataStore.pageSize) {
      return this.dataStore.skip += this.dataStore.pageSize;
    }
    // Otherwise, skip last remaining items
    return this.dataStore.skip += count;
  },

  handleLoadFactsFail(payload) {
    this.dataStore.loaded = true;
    this.dataStore.error = payload.error;
  },

  handleSavePageState(pageState) {
    this.dataStore.pageState = pageState;
  },

});