import Subheader from './Subheader';
import React from 'react';
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

const TopRowHeight = 120;
const parentTermsName = "Term Filters";

decorators.Toggle = (props) => {
    let isNodeTypeCategory = props.node && props.node.children && props.node.children.length > 0;
    let iconComponent = <div />;
    let iconStyle = { color: '#fff' };
    const style = props.style;

    if (isNodeTypeCategory) {
        iconComponent = props.node.toggled ? <i className="fa fa-plus fa-1" style={iconStyle}></i> : <i className="fa fa-minus fa-1" style={iconStyle}></i>;
    }

    return (
        <div style={style.base}>
            <div style={style.wrapper}>
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
        if(hasChanged(this.props, nextProps)){
            this.refreshComponent(nextProps);
        }
    }

    componentDidMount(){
        this.refreshComponent(this.props);
    }

    createRelevantTermsTree(props) {
        const { conjunctivetopics, language, termFilters, allSiteTopics, defaultLanguage } = props;

        let rootItem = {
            name: parentTermsName,
            folderKey: 'associatedKeywords',
            toggled: true,
            children: []
        };

        let popularItemsRoot = {
            name: 'Top 5 Terms',
            folderKey: 'top5Keywords',
            checked: true,
            toggled: true,
            children: []
        };

        let otherItemsRoot = {
            name: 'Other Terms',
            folderKey: 'otherKeywords',
            checked: true,
            toggled: true,
            children: []
        };

        let itemCount = 0;
        let popularTermsTotal = 0, otherTotal = 0;

        conjunctivetopics.forEach(topic => {
            const { mentions, conjunctionterm } = topic;
            const edge = fetchTermFromMap(allSiteTopics, conjunctionterm, language, defaultLanguage);
            const enabledConjunctiveTerm = termFilters.has(conjunctionterm);

            let newEntry = Object.assign({}, {
                name: edge.translatedname,
                folderKey: conjunctionterm,
                checked: enabledConjunctiveTerm,
                eventCount: mentions
            });

            if (itemCount++ < 5) {
                newEntry.parent = popularItemsRoot;
                popularItemsRoot.children.push(newEntry);
                popularTermsTotal += enabledConjunctiveTerm ? mentions : 0;
            } else {
                newEntry.parent = otherItemsRoot;
                otherItemsRoot.children.push(newEntry);
                otherTotal += enabledConjunctiveTerm ? mentions : 0;
            }
        });

        if (popularItemsRoot.children < 5) {
            popularItemsRoot.name = "Terms";
        }

        rootItem.children.push(popularItemsRoot);

        if (otherItemsRoot.children.length > 0) {
            rootItem.children.push(otherItemsRoot);
        }

        rootItem.eventCount = popularTermsTotal + otherTotal;

        return rootItem;
    }

    onToggle(node, toggled) {
        const { folderKey } = node;
        let { termFilters, maintopic, selectedplace } = this.props;

        if(!node.checked && termFilters.size < 2){
            termFilters.add(folderKey);
            this.handleDataFetch(maintopic, termFilters, selectedplace);
        }else if(node.checked){
            termFilters.delete(folderKey);
            this.handleDataFetch(maintopic, termFilters, selectedplace);
        }else{
            alert(`You're allowed to select up to 2 conjunctive terms. Please unselect one of the topics.`);
        }
    }

    handleDataFetch = (maintopic, termFilters, place) => {
        const { dataSource, timespanType, datetimeSelection, externalsourceid, fromDate, toDate } = this.props;
        const bbox = place && place.bbox ? place.bbox : this.props.bbox;
        const zoomLevel = place && place.zoom ? place.zoom : this.props.zoomLevel;

        maintopic = maintopic && !place ? maintopic : this.props.maintopic;
        termFilters = termFilters != null ? termFilters : this.props.termFilters;
        
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

        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, defaultBbox, zoomLevel, Array.from(termFilters), externalsourceid);
    }

    deleteTermFilters = () => {
        const { dataSource, externalsourceid, timespanType, datetimeSelection, zoomLevel, fromDate, toDate, maintopic, bbox } = this.props;
        const termFilters = new Set();

        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid);
    }

    clearTerms(){
        const { maintopic } = this.props;
        this.handleDataFetch(maintopic, []);
    }

    onFilterMouseUp(e) {
        const filter = e.target.value.trim();

        if (!filter) { return this.setState({ treeData: this.state.originalTreeData }); }
        var filtered = filters.filterTree(this.state.treeData, filter);
        filtered = filters.expandFilteredNodes(filtered, filter);
        this.setState({ treeData: filtered });
    }

    termSelected(node) {
        this.handleDataFetch(node.folderKey, []);
    }

    render() {
        let self = this;
        let treeviewStyle = {
            height: this.props.height - TopRowHeight
        };

        const decoratorsOverride = {
            Header: (props, ref) => {
                const style = props.style;
                let self = this;
                const termStyle = { paddingLeft: '3px', fontWeight: 800, fontSize: '14px', color: '#337ab7', width: '100%' };
                const categoryStyle = { paddingLeft: '3px', fontSize: '14px', color: '#fff', display: 'inline-table', fontWeight: 600 };
                let badgeClass = (props.node.checked || props.node.children) && props.node.eventCount > 0 ? "badge" : "badge badge-disabled";
                let isNodeTypeCategory = props.node.children && props.node.children.length > 0;
                let termClassName = !isNodeTypeCategory ? "relevantTerm" : "";
        
                return (
                    <div className="row" style={!props.node.highlighted || props.node.children ? style.base : style.baseHighlight} >
                        <div className="col-md-10" style={style.title}>
                            <input type="checkbox" onChange={()=>self.onToggle(props.node)}
                                checked={props.node.checked} />
                            <span className={termClassName} onClick={() => self.termSelected(props.node)} style={!isNodeTypeCategory ? termStyle : categoryStyle}>{props.node.name} </span>
                        </div>
                        <div style={props.node.name === parentTermsName ? style.parentBadge : style.badge} className="col-md-2">
                            {
                                props.node.eventCount && props.node.eventCount > 0 ?
                                    <span className={badgeClass}>{numeralLibs(props.node.eventCount).format(props.node.eventCount > 1000 ? '+0.0a' : '0a')}</span>
                                    : undefined
                            }
                        </div>
                    </div>
                );
            }
        };

        return (
            <div className="panel panel-selector">
                <Subheader style={styles.subHeader}>
                    <span style={styles.titleSpan}>FILTERS</span>
                    {
                        this.props.termFilters.size > 0 ?
                            <button type="button" onClick={() => self.clearTerms()} className="btn btn-primary btn-sm">Clear Selections</button>
                            : undefined
                    }
                </Subheader>
                <div style={styles.searchBox}>
                    <TypeaheadSearch
                        dashboardRefreshFunc={this.handleDataFetch}
                        bbox={this.props.bbox}
                        language={this.props.language}
                        defaultZoom={this.props.defaultZoom}
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
                        maintopic={this.props.maintopic}
                        deleteMainTopic={undefined /* we always require a topic to be defined */}
                        termFilters={this.props.termFilters}
                        deleteTermFilters={this.deleteTermFilters}
                    />
                </div>
                <div style={styles.searchBox}>
                    <div className="input-group">
                        <span className="input-group-addon">
                            <i className="fa fa-filter" id="edge-filter-icon"></i>
                        </span>
                        <input type="text"
                            className="form-control edgeFilterInput"
                            placeholder="Search the association list..."
                            onKeyUp={ev=>self.onFilterMouseUp(ev)} />
                    </div>
                </div>
                <div className="list-group" data-scrollable="" style={treeviewStyle}>
                    {
                        this.state && this.state.treeData && this.state.treeData.children ?
                            <div style={styles.component}>
                                <Treebeard animations={false}
                                    decorators={Object.assign({}, decorators, decoratorsOverride)}
                                    data={this.state.treeData}
                                    style={treeDataStyle} />
                            </div> : undefined
                    }
                </div>
            </div>
        );
    }
}