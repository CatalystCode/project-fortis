import React from 'react';
import Autosuggest from 'react-autosuggest';
import { fromMapToArray } from './shared';
import request from 'request';
import '../../styles/Insights/TypeaheadSearch.css';

const LOCATION_SUGGESTION = 'Location';
const TERM_SUGGESTION = 'Term';

const SUGGESTION_TO_ICON = {};
SUGGESTION_TO_ICON[LOCATION_SUGGESTION] = 'fa fa-map-marker fa-2x';
SUGGESTION_TO_ICON[TERM_SUGGESTION] = 'fa fa-tag fa-2x';

function fetchLocationsFromFeatureService(bbox, matchName, callback) {
  if (!matchName || !bbox || bbox.length !== 4) return callback(null, []);

  const host = process.env.REACT_APP_FEATURE_SERVICE_HOST;
  const url = `${host}/features/bbox/${bbox.join('/')}?include=bbox&filter_name=${matchName}`;

  request({ url, json: true }, (err, response) =>
    callback(err, (response && response.body && response.body.features) || []));
}

export default class TypeaheadSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
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

  onChange(event, { newValue }) {
    this.setTopicToState(newValue);
  }

  getSuggestionValue = suggestion => suggestion[this.getTopicFieldName()];

  onSuggestionsFetchRequested = ({ value }) => {
    const termSuggestions = fromMapToArray(this.props.allSiteTopics, value);
    termSuggestions.forEach(suggestion => suggestion.type = TERM_SUGGESTION);

    fetchLocationsFromFeatureService(this.props.bbox, value, (err, locationSuggestions) => {
      if (err) {
        console.error(`Error while fetching locations matching '${value}' in bbox [${this.props.bbox}] from feature service: ${err}`);
        this.setState({ termSuggestions });
      } else {
        locationSuggestions.forEach(suggestion => suggestion.type = LOCATION_SUGGESTION);
        this.setState({ suggestions: termSuggestions.concat(locationSuggestions) });
      }
    });
  }

  getTopicFieldName = () => this.props.language === this.props.defaultLanguage ? 'name' : 'translatedname'

  renderSuggestion = (element, { query }) => {
    const suggestionText = element[this.getTopicFieldName()];
    const normalizedQuery = query.toLowerCase();
    const matcher = new RegExp(`(:?${normalizedQuery})`, 'i');
    const parts = suggestionText.split(matcher).map(part => ({text: part, highlight: part.toLowerCase() === normalizedQuery}));

    return (
      <span className="suggestion-content">
        <span className="type">
          {<i className={SUGGESTION_TO_ICON[element.type]} />}
        </span>
        <span className="name">
          {
            parts.map((part, index) => {
              const className = part.highlight ? 'highlight' : null;

              return (
                <span className={className} key={index}>{part.text}</span>
              );
            })
          }
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
    const { suggestions, value } = this.state;
    const inputProps = {
      placeholder: "Type 'c'",
      value,
      onChange: (event, { newValue })=>this.onChange(event, { newValue })
    };

    return (
      <div className="input-group">
        <span className="input-group-addon">
          <i className="fa fa-search"></i>
        </span>
          <Autosuggest
            suggestions={suggestions}
            inputProps={inputProps}
            focusInputOnSuggestionClick={true}
            onSuggestionSelected={this.onSuggestionSelected}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            renderSuggestion={this.renderSuggestion}
            getSuggestionValue={this.getSuggestionValue}
          />
      </div>
    );
  }
}