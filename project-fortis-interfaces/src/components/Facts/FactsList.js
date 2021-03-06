import React from 'react';
import createReactClass from 'create-react-class';
import Chip from 'material-ui/Chip';
import Snackbar from 'material-ui/Snackbar';
import { PIPELINE_ALL } from '../../actions/constants';
import { getHumanDate, UCWords } from '../../utils/Utils.js';
import { methods } from '../../actions/Facts';
import DialogBox from '../dialogs/DialogBox';
import DataSelector from '../Insights/DataSelector';
import TypeaheadSearch from '../Insights/TypeaheadSearch';
import ListView from './ListView';

// Material UI style overrides
const styles = {
  radioButton: {
    width: 'auto',
    float: 'left',
    marginRight: '20px',
  },
  checkbox: {
    marginTop: '6px',
    marginRight: '20px',
  },
  iconStyle: {
    marginRight: '4px',
  },
  button: {
    marginLeft: '5px',
    height: '20px',
    lineHeight: '1',
    textAlign: 'center',
  },
  chip: {
    display: 'inline-block',
    margin: '2px',
  }
};

export const FactsList = createReactClass({
  _cardWidth: 320,
  _cardHeight: 200,
  _gutter: 20,
  _subtractedElements: ['.navbar', '.inputs-container'],

  getInitialState() {
    return {
      facts: {},
      pageState: '',
      snackbarMessage: '',
      loading: false,
    };
  },

  componentDidMount() {
    this.loadFacts();
  },

  componentWillReceiveProps(nextProps) {
    const { fromDate, toDate, maintopic } = this.props;

    if (nextProps.fromDate !== fromDate || nextProps.toDate !== toDate || nextProps.maintopic !== maintopic) {
      this.setState(this.getInitialState(), () => this.loadFacts(nextProps));
    }
  },

  render() {
    const { fullTermList } = this.props;
    const { facts, snackbarMessage } = this.state;

    const factsToRender = this.sortByEventTime(Object.values(facts));
    const mainContent = factsToRender && factsToRender.length ? this.renderFacts(factsToRender) : this.renderNoFacts();

    return (
      <div id="facts">
        <div className="inputs-container">
          <DataSelector
            hideDataSourceFilter
            {...this.props}
          />
          <TypeaheadSearch
            dashboardRefreshFunc={this.handleMainTopicChanged}
            excludeLocations
            excludeSources
            allSiteTopics={fullTermList}
            className="form-control edgeFilterInput"
            {...this.props}
          />
          <Snackbar
            open={!!snackbarMessage}
            message={snackbarMessage}
            autoHideDuration={3000}
          />
        </div>
        {mainContent}
      </div>
    );
  },

  handleMainTopicChanged(maintopic) {
    if (maintopic !== this.props.maintopic) {
      const { timespanType, datetimeSelection, fromDate, toDate, bbox, zoomLevel, dataSource, termFilters, externalsourceid, place } = this.props;
      this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, place);
    }
  },

  renderFacts(facts) {
    return (
      <div>
        <ListView ref="factsListView"
          minCardWidth={this._cardWidth}
          maxCardHeight={this._cardHeight}
          gutter={this._gutter}
          items={facts}
          renderCardItem={this.renderCardItem}
          loadItems={this.loadFacts}
          subtractedElements={this._subtractedElements}
        />
        <DialogBox ref="dialogBox" {...this.props} />
      </div>
    );
  },

  renderLoading() {
    return (
      <div className="loadingPage">
        <p>Loading facts&hellip;</p>
      </div>
    );
  },

  renderNoFacts() {
    return (
      <div className="noResults">
        <h3>No facts found.</h3>
      </div>
    );
  },

  renderTag(tag) {
    return (
      <Chip key={tag} style={styles.chip}>
        {UCWords(tag)}
      </Chip>
    );
  },

  renderCardItem(data, style) {
    const item = data.properties;

    return (
      <div className="cell" style={style}>
        <div className="card">
          <p className="date">
            {getHumanDate(item.eventtime, 'x', 'MM/DD/YYYY')}
          </p>
          <h3 className="title truncate-2">
            <a onClick={() => this.openItemDetails(item)}>
              {this.renderCardTitle(item)}
            </a>
          </h3>
          <div className="tags">
            {item.edges.sort().map(this.renderTag)}
          </div>
        </div>
      </div>
    );
  },

  renderCardTitle(item) {
    const { messageid, summary, title } = item;

    if (messageid.indexOf('Facebook') > -1 && messageid.indexOf('comment') > -1) {
      return summary;
    }

    if (!title) {
      return summary;
    }

    return title;
  },

  openItemDetails(item) {
    this.refs.dialogBox.open(item.messageid);
  },

  sortByEventTime(events) {
    return events.sort((a, b) => {
      const timeA = parseInt(a.properties.eventtime, 10);
      const timeB = parseInt(b.properties.eventtime, 10);
      if (timeA > timeB) return 1;
      if (timeA < timeB) return -1;
      return 0;
    });
  },

  loadFacts(props) {
    props = props || this.props;

    const { loading, pageState, facts } = this.state;
    if (loading) {
      return;
    }

    const { maintopic, fromDate, toDate } = props;
    if (!maintopic || !fromDate || !toDate) {
      return;
    }

    const pipelinekeys = this.props.enabledStreams.get(PIPELINE_ALL).sourceValues;
    methods.FACTS.loadFacts(pipelinekeys, maintopic, fromDate, toDate, pageState, (err, data) => {
      if (err) {
        this.setState({ loading: false, snackbarMessage: `Error fetching facts` });
        return console.error(`Error fetching facts: ${err}`);
      }

      const newFacts = (data && data.facts && data.facts.features) || [];
      const factsToAdd = newFacts.filter(fact => !facts[fact.properties.messageid]);
      const updatedFacts = Object.assign({}, facts);
      factsToAdd.forEach(fact => updatedFacts[fact.properties.messageid] = fact);

      const newPageState = data && data.facts && data.facts.pageState;

      this.setState({
        facts: updatedFacts,
        pageState: newPageState,
        snackbarMessage: `Loaded ${factsToAdd.length} new facts`,
        loading: false,
      });
    });
    this.setState({ loading: true });
  },
});