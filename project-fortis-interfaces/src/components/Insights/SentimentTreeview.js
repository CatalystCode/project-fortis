import Subheader from './Subheader';
import React from 'react';
import Button from 'react-bootstrap/lib/Button'
import { Treebeard, decorators } from 'react-treebeard';
import * as filters from './TreeFilter';
import TypeaheadSearch from './TypeaheadSearch';
import ActiveFiltersView from './ActiveFiltersView';
import '../../styles/Header.css';
import '../../styles/Insights/SentimentTreeView.css';
import { styles, treeDataStyle } from '../../styles/Insights/SentimentTreeview';
import numeralLibs from 'numeral';
import { fetchTermFromMap, hasChanged } from './shared';
import { DEFAULT_EXTERNAL_SOURCE, DEFAULT_DATA_SOURCE } from '../../actions/constants';

const TopRowHeight = 180;
const parentTermsName = "Term Filters";

decorators.Toggle = (props) => {
  const isNodeTypeCategory = props.node && props.node.children && props.node.children.length > 0;
  const iconStyle = { color: '#fff' };
  let iconComponent = <div />;

  if (isNodeTypeCategory) {
    iconComponent = props.node.toggled
      ? <i className="fa fa-plus fa-1" style={iconStyle}></i>
      : <i className="fa fa-minus fa-1" style={iconStyle}></i>;
  }

  return (
    <div style={props.style.base}>
      <div style={props.style.wrapper}>
        {iconComponent}
      </div>
    </div>
  );
};

export default class SentimentTreeview extends React.Component {
  constructor(props) {
    super(props);

    this.totalMentionCount = 0;
    this.visibleMentionCount = 0;

    this.state = {
      treeData: {},
      originalTreeData: {}
    }
  }

  refreshComponent(props){
    const treeData = this.createRelevantTermsTree(props);
    this.setState({ treeData: treeData, originalTreeData: treeData })
  }

  componentWillReceiveProps(nextProps) {
    if (hasChanged(this.props, nextProps)) {
      this.refreshComponent(nextProps);
    }
  }

  componentDidMount() {
    this.refreshComponent(this.props);
  }

  createRelevantTermsTree(props) {
    const { conjunctivetopics, language, termFilters, allSiteTopics, defaultLanguage } = props;

    const termsMentions = conjunctivetopics.reduce((total, { mentions, conjunctionterm }) =>
      termFilters.has(conjunctionterm) ? total + mentions : total, 0);

    const termsChildren = conjunctivetopics.map(({ mentions, conjunctionterm }) => ({
      name: fetchTermFromMap(allSiteTopics, conjunctionterm, language, defaultLanguage).translatedname,
      folderKey: conjunctionterm,
      checked: termFilters.has(conjunctionterm),
      eventCount: mentions
    })).filter(({ name }) => name && name.trim() !== "");

    return {
      eventCount: termsMentions,
      name: parentTermsName,
      folderKey: 'associatedKeywords',
      toggled: true,
      children: termsChildren
    };
  }

  onToggle(node, toggled) {
    const { folderKey } = node;
    let { termFilters, maintopic, selectedplace } = this.props;

    if (!node.checked && termFilters.size < 2) {
      termFilters.add(folderKey);
      this.handleDataFetch(maintopic, termFilters, selectedplace);
    } else if (node.checked) {
      termFilters.delete(folderKey);
      this.handleDataFetch(maintopic, termFilters, selectedplace);
    } else {
      alert(`You're allowed to select up to 2 conjunctive terms. Please unselect one of the topics.`);
    }
  }

  handleDataFetch = (maintopic, termFilters, place, dataSource, externalsourceid) => {
    const { timespanType, datetimeSelection, fromDate, toDate } = this.props;
    const bbox = place && place.placeid && place.placebbox.length ? place.placebbox : this.props.bbox;
    const zoomLevel = place && place.zoom ? place.zoom : this.props.zoomLevel;
    maintopic = maintopic && !place ? maintopic : this.props.maintopic;
    termFilters = termFilters != null ? termFilters : this.props.termFilters;

    if (!dataSource) {
      dataSource = this.props.dataSource;
      externalsourceid = this.props.externalsourceid;
    }

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, place);
  }

  deleteExternalSourceId = () => {
    const { dataSource, timespanType, datetimeSelection, zoomLevel, fromDate, toDate, termFilters, maintopic, bbox, selectedplace } = this.props;
    const externalsourceid = DEFAULT_EXTERNAL_SOURCE;

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
  }

  deleteDataSource = () => {
    const { externalsourceid, timespanType, datetimeSelection, zoomLevel, fromDate, toDate, termFilters, maintopic, bbox, selectedplace } = this.props;
    const dataSource = DEFAULT_DATA_SOURCE;

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
  }

  deleteSelectedPlace = () => {
    const { externalsourceid, dataSource, timespanType, datetimeSelection, zoomLevel, fromDate, toDate, termFilters, maintopic, defaultBbox } = this.props;

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, defaultBbox, zoomLevel, Array.from(termFilters), externalsourceid, null, null);
  }

  deleteTermFilters = () => {
    const { dataSource, externalsourceid, timespanType, datetimeSelection, zoomLevel, fromDate, toDate, maintopic, bbox, selectedplace } = this.props;
    const termFilters = new Set();

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
  }

  clearTerms = () => {
    const { maintopic } = this.props;
    this.handleDataFetch(maintopic, []);
  }

  onFilterMouseUp = (e) => {
    const filter = e.target.value.trim();

    if (!filter) {
      return this.setState({ treeData: this.state.originalTreeData });
    }

    let filtered = filters.filterTree(this.state.treeData, filter);
    filtered = filters.expandFilteredNodes(filtered, filter);

    this.setState({ treeData: filtered });
  }

  termSelected(node) {
    this.handleDataFetch(node.folderKey, []);
  }

  render() {
    const treeviewStyle = {
      height: this.props.height - TopRowHeight
    };

    const decoratorsOverride = {
      Header: (props, ref) => {
        const style = props.style;
        const isParentNode = props.node.name === parentTermsName;
        const termStyle = { paddingLeft: '3px', fontWeight: 800, fontSize: '14px', color: '#337ab7', width: '100%' };
        const categoryStyle = { paddingLeft: '3px', fontSize: '14px', color: '#fff', display: 'inline-table', fontWeight: 600 };
        const badgeClass = (props.node.checked || props.node.children) && props.node.eventCount > 0 ? "badge" : "badge badge-disabled";
        const isNodeTypeCategory = props.node.children && props.node.children.length > 0;
        const termClassName = !isNodeTypeCategory ? "relevantTerm" : "";
        const checkboxClicked = !isParentNode ? () => this.onToggle(props.node) : () => {};
        const termClicked = !isParentNode ? () => this.termSelected(props.node) : () => {};

        return (
          <div className="row" style={!props.node.highlighted || props.node.children ? style.base : style.baseHighlight} >
            <div className="col-md-10" style={style.title}>
              {!isParentNode ? <input type="checkbox" onChange={checkboxClicked} checked={props.node.checked} /> : undefined}
              <span className={termClassName} onClick={termClicked} style={!isNodeTypeCategory ? termStyle : categoryStyle}>{props.node.name} </span>
            </div>
            <div style={isParentNode ? style.parentBadge : style.badge} className="col-md-2">
              {props.node.eventCount && props.node.eventCount > 0 &&
              <span className={badgeClass}>
                {numeralLibs(props.node.eventCount).format(props.node.eventCount > 1000 ? '+0.0a' : '0a')}
              </span>}
            </div>
          </div>
        );
      }
    };

    const hasRelatedTerms = this.state && this.state.treeData && this.state.treeData.children && this.state.treeData.children.length > 0;

    let relatedTermsLabel;
    if (this.props.maintopic && hasRelatedTerms) {
      relatedTermsLabel = 'Search for terms related to the main keyword. Click a term in the list below to set the main keyword to that term, or click a checkbox to add the term to the list of filters.';
    } else if (this.props.maintopic && !hasRelatedTerms) {
      relatedTermsLabel = 'The selected term only appears on its own, no related terms available.';
    } else {
      relatedTermsLabel = 'First select a main keyword in the input box above.';
    }

    return (
      <div className="panel panel-selector">
        <Subheader style={styles.subHeader}>
          <span style={styles.titleSpan}>FILTERS</span>
          {this.props.termFilters.size > 0 &&
          <Button onClick={this.clearTerms} bsSize="sm" bsStyle="primary">
            Clear Selections
          </Button>}
        </Subheader>
        <div style={styles.searchBox}>
          <TypeaheadSearch
            className={this.props.inputClassName}
            trustedSources={this.props.trustedSources}
            dashboardRefreshFunc={this.handleDataFetch}
            bbox={this.props.bbox}
            enabledStreams={this.props.enabledStreams}
            language={this.props.language}
            defaultZoom={this.props.defaultZoom}
            dataSource={this.props.dataSource}
            featureservicenamespace={this.props.featureservicenamespace}
            allSiteTopics={this.props.allSiteTopics}
            maintopic={this.props.maintopic}
            defaultLanguage={this.props.defaultLanguage} />
        </div>
        <div style={styles.activeFiltersView}>
          <ActiveFiltersView
            deleteExternalSourceId={this.deleteExternalSourceId}
            externalsourceid={this.props.externalsourceid}
            selectedplace={this.props.selectedplace}
            deleteSelectedPlace={this.deleteSelectedPlace}
            deleteDataSource={this.deleteDataSource}
            dataSource={this.props.dataSource}
            allSiteTopics={this.props.allSiteTopics}
            language={this.props.language}
            enabledStreams={this.props.enabledStreams}
            maintopic={this.props.maintopic}
            conjunctiveTermsLength={this.props.conjunctiveTermsLength}
            deleteMainTopic={undefined /* we always require a topic to be defined */}
            termFilters={this.props.termFilters}
            deleteTermFilters={this.deleteTermFilters}
          />
        </div>
        <div style={styles.searchBox}>
          <div className="input-group">
            <input type="text"
              disabled={!this.props.maintopic || !hasRelatedTerms}
              className={this.props.inputClassName}
              placeholder={relatedTermsLabel}
              title={relatedTermsLabel}
              onKeyUp={this.onFilterMouseUp} />
          </div>
        </div>
        <div className="list-group" data-scrollable="" style={treeviewStyle}>
          {hasRelatedTerms &&
          <div style={styles.component}>
            <Treebeard animations={false}
              decorators={Object.assign({}, decorators, decoratorsOverride)}
              data={this.state.treeData}
              style={treeDataStyle} />
          </div>}
        </div>
      </div>
    );
  }
}
