import React from 'react';
import Autosuggest from 'react-autosuggest';
import { fromMapToArray } from './shared';
import { MenuItem, DropdownButton, InputGroup } from 'react-bootstrap';
import { fetchLocationsFromFeatureService } from '../../services/featureService';
import '../../styles/Insights/TypeaheadSearch.css';

export default class TypeaheadSearch extends React.Component {
  constructor(props) {
    super(props);

    this.DATASETS = {
      LOCATION: {type: 'Location', icon: 'fa fa-map-marker', fetcher: this.fetchLocationSuggestions, description: 'Search for locations'},
      TERM: {type: 'Term', icon: 'fa fa-tag', fetcher: this.fetchTermSuggestions, description: 'Search for terms'},
    };

    this.state = {
      suggestions: [],
      activeDataset: this.DATASETS.TERM,
      value: ''
    };
  }

  setTopicToState(value){
    this.setState({ value });
  }

  componentWillReceiveProps(nextProps) {
    this.setTopicToState(nextProps.maintopic);
  }

  onSuggestionSelected = (event, { suggestion }) => {
    this.props.dashboardRefreshFunc(suggestion.name, [], suggestion.bbox);
  }

  onChange = (event, { newValue }) => {
    this.setTopicToState(newValue);
  }

  getSuggestionValue = suggestion => suggestion[this.getTopicFieldName()];

  fetchTermSuggestions = (value, callback) => {
    const termSuggestions = fromMapToArray(this.props.allSiteTopics, value);
    termSuggestions.forEach(suggestion => suggestion.icon = this.DATASETS.TERM.icon);
    return callback(termSuggestions);
  }

  fetchLocationSuggestions = (value, callback) => {
    fetchLocationsFromFeatureService(this.props.bbox, value, (err, locationSuggestions) => {
      if (err) {
        console.error(`Error while fetching locations matching '${value}' in bbox [${this.props.bbox}] from feature service: ${err}`);
        callback([]);
      } else {
        locationSuggestions.forEach(suggestion => suggestion.icon = this.DATASETS.LOCATION.icon);
        callback(locationSuggestions);
      }
    });
  }

  onSuggestionsFetchRequested = ({ value }) => {
    this.state.activeDataset.fetcher(value, (suggestions) => this.setState({ suggestions }));
  }

  getTopicFieldName = () => this.props.language === this.props.defaultLanguage ? 'name' : 'translatedname'

  renderSuggestion = (element, { query }) => {
    const suggestionText = element[this.getTopicFieldName()];
    const normalizedQuery = query.toLowerCase();
    const matcher = new RegExp(`(:?${normalizedQuery})`, 'i');
    const parts = suggestionText.split(matcher).map(part => ({text: part, highlight: part.toLowerCase() === normalizedQuery}));

    if (element.layer) {
      parts.push({text: ` (${element.layer})`});
    }

    return (
      <span className="suggestion-content">
        <span className="type">
          <i className={`${element.icon} fa-2x`} />
        </span>
        <span className="name">
          {parts.map((part, index) =>
            <span className={part.highlight ? 'highlight' : null} key={index}>{part.text}</span>
          )}
        </span>
      </span>
    );
  }

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  }

  render() {
    const { suggestions, value, activeDataset } = this.state;

    return (
      <InputGroup>
        <InputGroup.Button>
          <DropdownButton id="dataset-switcher-button" componentClass={InputGroup.Button} title={<i className={activeDataset.icon} title={activeDataset.description}></i>}>
            {Object.values(this.DATASETS).map(dataset =>
              <MenuItem active={dataset === activeDataset} key={dataset.type} onClick={() => this.setState({ activeDataset: dataset })}>
                <span><i className={dataset.icon} /> {dataset.description}</span>
              </MenuItem>
            )}
          </DropdownButton>
        </InputGroup.Button>
        <Autosuggest
          suggestions={suggestions}
          inputProps={{placeholder: "Type 'c'", value, onChange: this.onChange}}
          focusInputOnSuggestionClick={true}
          onSuggestionSelected={this.onSuggestionSelected}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          renderSuggestion={this.renderSuggestion}
          getSuggestionValue={this.getSuggestionValue}
        />
      </InputGroup>
    );
  }
}