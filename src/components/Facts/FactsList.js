import React from 'react';
import createReactClass from 'create-react-class';
import Chip from 'material-ui/Chip';
import { PIPELINE_ALL } from '../../actions/constants';
import { getHumanDate, UCWords } from '../../utils/Utils.js';
import { methods } from '../../actions/Facts';
import DialogBox from '../dialogs/DialogBox';
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
  _subtractedElements: ['.navbar', '#filters'],

  getInitialState() {
    return {
      loaded: false,
      facts: [],
    };
  },

  componentDidMount() {
    this.loadFacts();
  },

  render() {
    const { loaded, facts } = this.state;

    if (!loaded) {
      return this.renderLoading();
    }

    if (!facts || !facts.length) {
      return this.renderNoFacts();
    }

    return (
      <div id="facts">
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
      <div id="facts" >
        <div className="noResults">
          <h3>No facts found.</h3>
        </div>
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
            <a onClick={() => this.refs.dialogBox.open(item.messageid)}>
              {item.title}
            </a>
          </h3>
          <div className="tags">
            {item.edges.sort().map(this.renderTag)}
          </div>
        </div>
      </div>
    );
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

  loadFacts() {
    const pipelinekeys = this.props.enabledStreams.get(PIPELINE_ALL).sourceValues;

    methods.FACTS.loadFacts(pipelinekeys, (err, data) => {
      if (err) return console.error(`Error fetching facts: ${err}`);
      if (!data || !data.facts || !data.facts.features || !data.facts.features.length) return console.error(`No facts for ${pipelinekeys}`);

      this.setState({
        facts: this.sortByEventTime(data.facts.features),
        loaded: true,
      });
    });
  },
});