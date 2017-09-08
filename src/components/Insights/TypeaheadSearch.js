import React from 'react';
import Autosuggest from 'react-autosuggest';
import { fromMapToArray } from './shared';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import '../../styles/Insights/TypeaheadSearch.css';

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

  onSuggestionSelected(event, { suggestion }) {
    this.props.dashboardRefreshFunc(suggestion.name, []);
  }

  onChange(event, { newValue }) {
    this.setTopicToState(newValue);
  }

  getSuggestionValue = suggestion => suggestion[this.getTopicFieldName()];

  onSuggestionsFetchRequested({ value }) {
    const { allSiteTopics } = this.props;
    const suggestions = fromMapToArray(allSiteTopics, value);

    this.setState({ suggestions });
  }

  getTopicFieldName = () => this.props.language === this.props.defaultLanguage ? 'name' : 'translatedname'

  renderSuggestion(element, { query }) {
    const suggestionText = element[this.getTopicFieldName()];
    const matches = match(suggestionText, query);
    const parts = parse(suggestionText, matches);
    const iconMap = new Map([["Location", "fa fa-map-marker fa-2x"], ["Term", "fa fa-tag fa-2x"]]);

    return (
      <span className="suggestion-content">
        <span className="type">
          {<i className={iconMap.get(element.type)} />}
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

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    });
  }

  render() {
    const { suggestions, value } = this.state;
    const inputProps = {
      placeholder: 'Type \'c\'',
      value,
      onChange: (event, { newValue })=>this.onChange(event, { newValue })
    };

    return (
      <div className="input-group">
        <span className="input-group-addon">
          <i className="fa fa-search"></i>
        </span>
          <Autosuggest suggestions={suggestions}
              inputProps={inputProps}
              focusInputOnSuggestionClick={true}
              onSuggestionSelected={(event, { suggestion })=>this.onSuggestionSelected(event, { suggestion })}
              onSuggestionsFetchRequested={({value})=>this.onSuggestionsFetchRequested({value})}
              onSuggestionsClearRequested={()=>this.onSuggestionsClearRequested()}
              renderSuggestion={(element, query)=>this.renderSuggestion(element, query)}
              getSuggestionValue={value => this.getSuggestionValue(value)} />
      </div>
    );
  }
}