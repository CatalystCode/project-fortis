import React from 'react';
import Autosuggest from 'react-autosuggest';
import { fromMapToArray, fetchTermFromMap } from './shared';
import flatten from 'lodash/flatten';
import last from 'lodash/last';
import first from 'lodash/first';
import initial from 'lodash/initial';
import { fetchLocationsFromFeatureService } from '../../services/featureService';
import '../../styles/Insights/TypeaheadSearch.css';

export default class TypeaheadSearch extends React.Component {
  constructor(props) {
    super(props);

    this.DATASETS = {};
    this.DATASETS.TERM = { type: 'Term', icon: 'fa fa-tag', fetcher: this.fetchTermSuggestions, displayName: 'terms' };
    if (!props.excludeLocations) this.DATASETS.LOCATION = { type: 'Location', icon: 'fa fa-map-marker', fetcher: this.fetchLocationSuggestions, displayName: 'locations' };
    if (!props.excludeSources) this.DATASETS.SOURCE = { type: 'Source', icon: 'fa fa-share-alt', fetcher: this.fetchSourcesSuggestions, displayName: 'sources' };

    this.state = {
      suggestions: [],
      value: ''
    };
  }

  setTopicToState(value) {
    this.setState({ value });
  }

  componentWillReceiveProps(nextProps) {
    const { allSiteTopics } = nextProps;
    const edge = fetchTermFromMap(allSiteTopics, nextProps.maintopic);

    this.setTopicToState(edge.translatedname);
  }

  parsePlace(suggestion) {
    if (suggestion.layer) {
      const { id, centroid, bbox, name } = suggestion;

      return {
        placeid: id,
        placecentroid: centroid,
        placebbox: bbox,
        name: name
      };
    }

    return undefined;
  }

  onSuggestionSelected = (event, { suggestion }) => {
    if (suggestion.pipelinekey) {
      this.props.dashboardRefreshFunc(null, null, null, suggestion.pipelinekey, suggestion.value);
    } else {
      this.props.dashboardRefreshFunc(suggestion.name, [], this.parsePlace(suggestion));
    }
  }

  onChange = (event, { newValue }) => {
    this.setTopicToState(newValue);
  }

  getSuggestionValue = suggestion => suggestion[this.getTopicFieldName()];

  fetchTermSuggestions = (value, callback) => {
    const { allSiteTopics } = this.props;

    const termSuggestions = fromMapToArray(allSiteTopics, value);
    termSuggestions.forEach(suggestion => suggestion.icon = this.DATASETS.TERM.icon);
    return callback(termSuggestions);
  }

  fetchLocationSuggestions = (value, callback) => {
    const { bbox, featureservicenamespace } = this.props;

    fetchLocationsFromFeatureService(bbox, value, featureservicenamespace, (err, locationSuggestions) => {
      if (err) {
        console.error(`Error while fetching locations matching '${value}' in bbox [${bbox}] from feature service: ${err}`);
        callback([]);
      } else {
        locationSuggestions.forEach(suggestion => {
          suggestion.icon = this.DATASETS.LOCATION.icon;
          suggestion.translatedname = suggestion.name;
        });
        callback(locationSuggestions);
      }
    });
  }

  fetchSourcesSuggestions = (value, callback) => {
    const { dataSource, enabledStreams, trustedSources } = this.props;
    const pipelinekeys = enabledStreams.get(dataSource).sourceValues;
    const activeTrustedSources = trustedSources.filter(source => pipelinekeys.indexOf(source.pipelinekey) >= 0);

    const suggestions = activeTrustedSources
    .map(suggestion => {
      const { displayname, externalsourceid, pipelinekey } = suggestion;

      return Object.assign({}, {
        name: displayname,
        value: externalsourceid,
        translatedname: externalsourceid,
        icon: enabledStreams.get(pipelinekey).icon
      }, suggestion);
    });

    callback(suggestions);
  }

  onSuggestionsFetchRequested = ({ value }) => {
    const suggestionFetchers = Object.values(this.DATASETS).map(dataset => dataset.fetcher);
    const suggestionPromises = suggestionFetchers.map(fetcher => new Promise(resolve => fetcher(value, resolve)));
    Promise.all(suggestionPromises)
      .then(nestedSuggestions => this.setState({ suggestions: flatten(nestedSuggestions) }));
  }

  getTopicFieldName = () => this.props.language === this.props.defaultLanguage ? 'name' : 'translatedname'

  renderSuggestion = (element, { query }) => {
    const suggestionText = element[this.getTopicFieldName()];
    const normalizedQuery = query.toLowerCase();
    const matcher = new RegExp(`(:?${normalizedQuery})`, 'i');
    const parts = suggestionText.split(matcher).map(part => ({ text: part, highlight: part.toLowerCase() === normalizedQuery }));

    if (element.layer) {
      parts.push({ text: ` (${element.layer})` });
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

  formatLabel() {
    const datasetNames = Object.values(this.DATASETS).map(dataset => dataset.displayName);
    return datasetNames.length > 1
      ? `Search for ${initial(datasetNames).join(', ')} and ${last(datasetNames)}`
      : `Search for ${first(datasetNames)}`;
  }

  render() {
    const { className } = this.props;
    const { suggestions, value } = this.state;
    const label = this.formatLabel();

    const inputProps = {
      value,
      className,
      placeholder: label,
      title: label.length > 35 ? label : null,
      onChange: this.onChange
    };

    return (
      <div className="input-group">
        <Autosuggest
          focusInputOnSuggestionClick
          suggestions={suggestions}
          inputProps={inputProps}
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