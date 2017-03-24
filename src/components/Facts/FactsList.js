import React from 'react';
import Fluxxor from 'fluxxor';
import ListView from './ListView';
import { Link } from 'react-router';
import { SERVICES } from '../../services/services';
import { getHumanDate, containsEqualValues, UCWords, momentLastMonths } from '../../utils/Utils.js';
import { fragmentToArray, changeFactsUrl } from '../../utils/Fact.js';
import SuperSelectField from 'material-ui-superselectfield/lib/superSelectField'
import Chip from 'material-ui/Chip';

// Material UI style overrides
const styles = {
  radioButton: {
    width: "auto",
    float: "left",
    marginRight: "20px",
  },
  checkbox: {
    marginTop: "6px",
    marginRight: "20px",
  },
  iconStyle: {
    marginRight: "4px",
  },
  button: {
    marginLeft: "5px",
    height: "20px",
    lineHeight: '1',
    textAlign: "center",
  },
  chip: {
    display: "inline-block",
    margin: "2px",
  }
};

const FluxMixin = Fluxxor.FluxMixin(React),
  StoreWatchMixin = Fluxxor.StoreWatchMixin("FactsStore");

export const FactsList = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  displayName: 'FactsList',
  sources: ["tadaweb"],

  // Card sizes
  _cardWidth: 320,
  _cardHeight: 200,
  _gutter: 20,

  // Select tags
  _select: "selectFilter",
  _isSelectOpen: false,

  resetState: function (state, selectedTags = []) {
    state.loaded = false;
    state.facts = [];
    state.skip = 0;
    state.selectedTags = selectedTags;
    return state;
  },

  getStateFromFlux: function () {
    let state = this.getFlux().store("FactsStore").getState();
    const tags = fragmentToArray(this.props.tags);
    if (!containsEqualValues(state.selectedTags, tags)) {
      return this.resetState(state, tags);
    }
    return state;
  },

  componentWillReceiveProps: function (nextProps) {
    let state = this.getStateFromFlux();
    const curr = fragmentToArray(this.props.tags);
    const next = fragmentToArray(nextProps.tags);
    if (!containsEqualValues(curr, next)) {
      state = this.resetState(state, next);
    }
    this.setState(state);
  },

  componentDidMount: function () {
    // get list of unique tags
    if (this.state.tags.length === 0) {
      this.loadTags();
    }
    // get first page of all facts 
    if (this.state.facts.length === 0) {
      this.loadFacts();
    }
  },

  componentDidUpdate(prevProps, prevState) {
    if (!this.state.loaded) {
      this.loadFacts();
    }
  },

  render() {
    // Loading state
    if (!this.state.loaded) {
      return (<div className="loadingPage"><p>Loading facts&hellip;</p></div>);
    }

    // No results
    if (this.state.facts.length === 0) {
      return (
        <div id="facts" >

          <div className="noResults">
            <h3>No facts found.</h3>
            <Link to={`/site/${this.props.siteKey}/facts/`}>Reset filters</Link>
          </div>
        </div>);
    }

    const facts = this.state.facts;
    const select = this.renderSelect();
    const chips = this.renderChips();

    // List view 
    return (
      <div id="facts">
        <div id="filters">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-9 hidden-sm">
                <div id="tags">{chips}</div>
              </div>
              <div className="col-md-3 col-sm-12">
                <div id="select">{select}</div>
              </div>
            </div>
          </div>
        </div>
        <ListView ref="factsListView"
          minCardWidth={this._cardWidth}
          maxCardHeight={this._cardHeight}
          gutter={this._gutter}
          items={facts}
          renderCardItem={this.renderCardItem}
          loadItems={this.loadFacts}
          subtractedElements={['.navbar', '#filters']}
          />
      </div>
    );
  },

  translate(sentence, fromLanguage, toLanguage, factId) {
    let self = this;
    SERVICES.translateSentence(sentence, fromLanguage, toLanguage, (translatedSentence, error) => {
      if (translatedSentence) {
        self.state.facts.forEach(fact => {
          if (fact.id === factId) {
            fact.language = toLanguage;
            fact.title = translatedSentence
          }
        });
        self.setState({
          elements: self.state
        });
      }
      else {
        console.error(`[${error}] occured while translating sentence`);
      }
    }
    );
  },

  renderCardItem(data, style) {
    const item = data.properties;
    const dateString = getHumanDate(item.createdtime, "MM/DD/YYYY");
    const title = item.sentence;
    return (
      <div className="cell" style={style}>
        <div className="card">
          <p className="date">{dateString}
            {this.state.language !== item.language ? <button className="btn btn-primary btn-sm" style={styles.button}
              onClick={() => this.translate(title, item.language, this.state.language, item.messageid)}>Translate</button> : ''}
          </p>
          <h3 className="title truncate-2"><Link to={`/site/${this.props.siteKey}/facts/detail/${item.messageid}`}>{title}</Link></h3>
          <div className="tags">
            {item.edges.sort().map(function (tag) {
              const name = UCWords(tag);
              return <Chip key={tag} style={styles.chip} onTouchTap={(event) => this.handleSelectTag(tag)}>{name}</Chip>;
            }, this)}
          </div>
        </div>
      </div>
    );
  },

  handleSelectTag(tag) {
    changeFactsUrl(this.props.siteKey, [tag]);
  },

  renderSelect() {
    if (this.state.tags.length === 0) {
      return;
    }

    let dataSource = this.state.tags.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) || (a.name.toLowerCase() === b.name.toLowerCase()) - 1);

    dataSource = dataSource.map((x, index) => {
      const tag = x.name.toLowerCase();
      return (
        <div key={tag} value={tag} label={tag}>{UCWords(x.name)}</div>
      );
    });

    return (
      <SuperSelectField
        ref={this._select}
        name={this._select}
        hintText="Filter"
        multiple
        onSelect={(selectedValues) => this.setState({ 'selectedTags': selectedValues })}
        value={this.state.selectedTags}
        selectionsRenderer={this.handleSelectRenderer}
        menuProps={{ maxHeight: 460 }}
        style={{ width: "100%" }}
        >
        {dataSource}
      </SuperSelectField>
    );
  },

  // Using custom renderer to trigger page update only once the multiple select menu has closed
  handleSelectRenderer(values, hintText) {
    if (this.refs[this._select] && this.refs[this._select].state.isOpen === false) {
      changeFactsUrl(this.props.siteKey, this.state.selectedTags);
    }
    return hintText;
  },

  renderChips() {
    const selectedTags = this.getSelectedTagNames();
    return (
      <div className="chips">
        {selectedTags.map(function (name) {
          const tag = name.toLowerCase();
          return (
            <Chip key={tag} style={{ margin: 2 }} onRequestDelete={(event) => this.handleRequestDelete(tag)}>{UCWords(name)}</Chip>
          );
        }, this)}
      </div>
    );
  },

  handleRequestDelete(name) {
    // create mutable clone of selected tags for splicing the deleted tag
    let selectedTags = this.state.selectedTags.slice(); 
    const index = selectedTags.indexOf(name);
    if (index > -1) {
      selectedTags.splice(index, 1);
      changeFactsUrl(this.props.siteKey, selectedTags);
    } else {
      console.error("Unable to delete tag:", name);
    }
  },

  loadTags: function () {
    const range = momentLastMonths(3);
    const fromDate = range.fromDate;
    const toDate = range.toDate;
    this.getFlux().actions.FACTS.load_tags(this.props.siteKey, this.sources, fromDate, toDate);
  },

  loadFacts() {
    // NB: filter edges param uses lowercase names
    const selectedTags = this.state.selectedTags.slice().map(s => s.toLowerCase()); 
    this.getFlux().actions.FACTS.load_facts(this.props.siteKey, this.state.pageSize, this.state.skip, selectedTags, this.sources);
  },

  // returns the selected (case sensitive) tag names from term collection
  getSelectedTagNames() {
    const selectedTags = this.state.selectedTags.slice().map(s => s.toLowerCase());
    const filteredTags = this.state.tags.filter(x => selectedTags.indexOf(x.name.toLowerCase()) > -1);
    return filteredTags.reduce((prev, curr) => {
      prev.push(curr['name']);
      return prev;
    }, []);
  },

});