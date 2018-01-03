import React from 'react';
import { SERVICES } from '../../services/Dashboard';
import '../../styles/Insights/ActivityFeed.css';
import NoData from '../Graphics/NoData';
import styles from '../../styles/Insights/ActivityFeed';
import Infinite from 'react-infinite';
import { Tabs, Tab } from 'material-ui/Tabs';
import CircularProgress from 'material-ui/CircularProgress';
import FortisEvent from './FortisEvent';
import constants from '../../actions/constants';
import DialogBox from '../dialogs/DialogBox';
import { fetchTermFromMap, innerJoin, hasChanged } from './shared';

const ActivityConsts = constants.ACTIVITY_FEED;

function prettifyExternalSourceIds(elementsMutated, trustedSources) {
    const externalsourceIdToDisplayName = {};
    trustedSources.forEach(source => {
        externalsourceIdToDisplayName[source.externalsourceid] = source.displayname;
    });

    elementsMutated.forEach(element => {
        const externalSourceDisplayName = externalsourceIdToDisplayName[element.externalsourceid];
        if (externalSourceDisplayName) {
            element.externalsourceid = externalSourceDisplayName;
        }
    });
}

export default class ActivityFeed extends React.Component {
    constructor(props) {
        super(props);
        this.translateTerm = this.translateTerm.bind(this);
        this.handleInfiniteLoad = this.handleInfiniteLoad.bind(this);
        this.translateEvent = this.translateEvent.bind(this);
        this.handleOpenDialog = this.handleOpenDialog.bind(this);
        this.setInfinitLoadAsComplete = this.setInfinitLoadAsComplete.bind(this);
        this.resetNewsFeed = this.resetNewsFeed.bind(this);
        this.sourceOnClickHandler = this.sourceOnClickHandler.bind(this);
        this.searchSubmit = this.searchSubmit.bind(this);
        this.renderDataSourceTabs = this.renderDataSourceTabs.bind(this);

        this.state = {
            elements: [],
            filteredSource: props.dataSource || "all",
            processedEventids: new Set(),
            isInfiniteLoading: false,
            searchValue: "",
            pageState: null
        };
    }

    handleInfiniteLoad() {
        const self = this;
        const isInfiniteLoading = true;

        this.setState({ isInfiniteLoading });
        setTimeout(() => {
            self.processNewsFeed(self.props);
        }, ActivityConsts.INFINITE_LOAD_DELAY_MS);
    }

    fetchSentences(props, callback) {
        const { bbox, fromDate, zoomLevel, toDate, maintopic, termFilters, enabledStreams, trustedSources } = props;
        const { pageState, filteredSource } = this.state;
        const pipelinekeys = enabledStreams.get(filteredSource).sourceValues;
        const externalsourceid = props.externalsourceid !== constants.DEFAULT_EXTERNAL_SOURCE ? props.externalsourceid : null;
        const fulltextTerm = "";
        const activeTrustedSources = (trustedSources || []).filter(source => pipelinekeys.indexOf(source.pipelinekey) >= 0);

        SERVICES.FetchMessageSentences(externalsourceid, bbox, zoomLevel, fromDate, toDate, ActivityConsts.OFFSET_INCREMENT, pageState, [maintopic].concat(Array.from(termFilters)), pipelinekeys, fulltextTerm, (error, response, body) => {
            callback(error, response, body, activeTrustedSources);
        });
    }

    renderDataSourceTabs(iconStyle) {
        let tabs = [];
        const { filteredSource } = this.state;
        const { dataSource, enabledStreams } = this.props;

        if (dataSource === constants.DEFAULT_DATA_SOURCE) {
            for (let [source, value] of enabledStreams.entries()) {
                let icon = <i style={iconStyle} className={`fa ${value.icon}`} />;
                let tab = <Tab key={source}
                    label={value.label}
                    value={source}
                    icon={icon}>
                </Tab>;

                tabs.push(tab);
            }
        } else {
            let tabSchema = enabledStreams.get(filteredSource);
            let icon = <i style={iconStyle} className={`fa ${tabSchema.icon}`} />;
            let tab = <Tab key={tabSchema.label}
                label={tabSchema.label}
                value={filteredSource}
                icon={icon}>
            </Tab>;

            tabs.push(tab);
        }

        return tabs;
    }

    translateEvent(eventId, translatedSentence) {
        const targetElement = this.state.elements.findIndex(feature => feature.messageid === eventId);
        let elements = this.state.elements;

        if (targetElement > -1) {
            elements[targetElement].summary = translatedSentence;
        } else {
            console.error(`Unexpected error occured where the translation request for event ${eventId} failed.`);
        }

        this.setState({ elements });
    }

    parseEvent(gqlEvent) {
        const { messageid, title, externalsourceid, link, summary, pipelinekey, eventtime, sentiment, edges, language } = gqlEvent.properties;
        const { coordinates } = gqlEvent;

        return Object.assign({}, { coordinates, messageid, externalsourceid, summary, pipelinekey, eventtime, link, sentiment, edges, language, title });
    }

    setInfinitLoadAsComplete(state){
        this.setState(Object.assign({}, state, { isInfiniteLoading: false }));
    }

    buildElements(props, callback) {
        let self = this;

        this.fetchSentences(props, (error, response, body, trustedSources) => {
            if (!error && response.statusCode === 200 && body.data) {
                const { elements, processedEventids } = self.state;
                const newsFeedPage = body.data.messages ? body.data.messages.features.filter(feature => feature.properties.summary && feature.properties.summary.length && !processedEventids.has(feature.properties.messageid)).map(this.parseEvent) : [];

                const elementsMutated = elements.concat(newsFeedPage);
                prettifyExternalSourceIds(elementsMutated, trustedSources);
                const pageStateMutated = body.data.messages ? body.data.messages.pageState || null : null;
                const processedEventIdsMutated= new Set(Array.from(processedEventids).concat(newsFeedPage.map(msg=>msg.messageid)));

                callback({ elements: elementsMutated, pageState: pageStateMutated, processedEventids: processedEventIdsMutated });
            } else {
                console.error(`[${error}] occured while processing message request`);
            }
        });
    }

    processNewsFeed(props) {
        const { pageState, elements } = this.state;

        //If events have already been rendered and pageState is null, then there are no more events to show
        if (pageState || !elements.length) {
            this.buildElements(props, this.setInfinitLoadAsComplete);
        } else {
            this.setInfinitLoadAsComplete(this.state);
        }
    }

    elementInfiniteLoad() {
        return <div className="infinite-list-item">
            <div className="row">
                <div className="col-lg-12" style={styles.loadingIcon}>
                    Loading... <CircularProgress />
                </div>
            </div>
        </div>;
    }

    sourceOnClickHandler(filteredSource) {
        this.setState(Object.assign({}, this.resetNewsFeed(), { filteredSource }));
        setTimeout(() => this.processNewsFeed(this.props), ActivityConsts.INFINITE_LOAD_DELAY_MS);
    }

    resetNewsFeed() {
        return {
            elements: [], 
            filteredSource: null, 
            processedEventids: new Set(),
            isInfiniteLoading: false,
            searchValue: "",
            pageState: null
        };
    }

    searchSubmit(event) {
        const searchValue = this.refs.filterTextInput.value;

        event.preventDefault();
        this.setState({ searchValue });
    }

    componentDidMount() {
        setTimeout(() => this.processNewsFeed(this.props), ActivityConsts.INFINITE_LOAD_DELAY_MS);
    }

    componentWillReceiveProps(nextProps) {
        if(hasChanged(this.props, nextProps)) {
          this.setState(Object.assign({}, this.resetNewsFeed(), {filteredSource: nextProps.dataSource, isInfiniteLoading: true}));
          setTimeout(() => this.processNewsFeed(nextProps), ActivityConsts.INFINITE_LOAD_DELAY_MS);
        }
    }

    translateTerm(term) {
        const { allSiteTopics } = this.props;
        const edge = fetchTermFromMap(allSiteTopics, term);

        return edge && edge.translatedname ? edge.translatedname.toLowerCase() : term.toLowerCase();
    }

    translateTerms = terms => terms.map(this.translateTerm);

    getSelectedTopicsAndSearchValue(){
        let tags = [];
        const { maintopic, termFilters } = this.props;
        const termsInBaseLang = [maintopic.toLowerCase()].concat(Array.from(termFilters));
        tags = this.translateTerms(termsInBaseLang);
        if(this.refs && this.refs.filterTextInput && this.refs.filterTextInput.value) {
            tags.push(this.refs.filterTextInput.value);
        }

        return tags;
    }

    filterElement(event, searchValue) {
        return event.summary.indexOf(searchValue) > -1;
    }

    render() {
        const { isInfiniteLoading, filteredSource, searchValue, elements } = this.state;
        const { language, infiniteScrollHeight, enabledStreams } = this.props;
        //todo: this is a tactical workaround until we arrive at a storage solution that supports full text searches 
        const renderedElements = searchValue ? elements.filter(event => this.filterElement(event, searchValue)) : elements;
        const selectedTags = this.getSelectedTopicsAndSearchValue();

        return (
            <div className="col-lg-12 news-feed-column">
                <Tabs tabItemContainerStyle={styles.tabStyle}
                    value={filteredSource}
                    id="newsFeedContainer"
                    onChange={this.sourceOnClickHandler}>
                    {this.renderDataSourceTabs(styles.iconStyle)}
                </Tabs>
                {renderedElements.length ?
                <Infinite elementHeight={ActivityConsts.ELEMENT_ITEM_HEIGHT}
                    containerHeight={infiniteScrollHeight - ActivityConsts.NEWS_FEED_SEARCH_CONTAINER_HEIGHT}
                    infiniteLoadBeginEdgeOffset={600}
                    className="infite-scroll-container"
                    onInfiniteLoad={this.handleInfiniteLoad}
                    loadingSpinnerDelegate={this.elementInfiniteLoad()}
                    isInfiniteLoading={isInfiniteLoading} >
                    {
                         renderedElements.map(feature => {
                         const translatedEdges = this.translateTerms(feature.edges).concat([searchValue]);

                         return <FortisEvent key={feature.messageid}
                                id={feature.messageid}
                                sentence={feature.summary}
                                source={feature.pipelinekey}
                                originalSource={feature.externalsourceid}
                                postedTime={feature.eventtime}
                                sentiment={feature.sentiment}
                                enabledStreams={enabledStreams}
                                coordinates={feature.coordinates}
                                link={feature.link}
                                featureEdges={translatedEdges}
                                edges={innerJoin(selectedTags, translatedEdges)}
                                language={feature.language}
                                pageLanguage={language}
                                updateFeedWithText={this.translateEvent}
                                handleOpenDialog={this.handleOpenDialog} />;
                        })
                    }
                </Infinite> : <NoData />}
                {renderedElements.length ? <div className="panel-footer clearfix">
                    <div className="input-group">
                        <input ref="filterTextInput" type="text" placeholder="Filter News Feed .." className="form-control input-sm" />
                        <span className="input-group-btn">
                            <button onClick={this.searchSubmit} className="btn btn-default btn-sm"><i className="fa fa-search"></i>
                            </button>
                        </span>
                    </div>
                </div> : null}
                <DialogBox ref="dialogBox" {...this.props}></DialogBox>
            </div>
        );
    }

    handleOpenDialog(eventid) {
        this.refs.dialogBox.open(eventid);
    }
}