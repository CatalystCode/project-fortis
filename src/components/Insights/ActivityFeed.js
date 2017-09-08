import React from 'react';
import { SERVICES } from '../../services/Dashboard';
import '../../styles/Insights/ActivityFeed.css';
import styles from '../../styles/Insights/ActivityFeed';
import Infinite from 'react-infinite';
import { Tabs, Tab } from 'material-ui/Tabs';
import CircularProgress from 'material-ui/CircularProgress';
import FortisEvent from './FortisEvent';
import constants from '../../actions/constants';
import DialogBox from '../dialogs/DialogBox';
import { fetchTermFromMap, innerJoin } from './shared';

const ActivityConsts = constants.ACTIVITY_FEED;

export default class ActivityFeed extends React.Component {
    constructor(props) {
        super(props);
        this.translateTerm = this.translateTerm.bind(this);
        this.handleInfiniteLoad = this.handleInfiniteLoad.bind(this);
        this.translateEvent = this.translateEvent.bind(this);
        this.handleOpenDialog = this.handleOpenDialog.bind(this);

        this.state = {
            elements: [],
            filteredSource: props.dataSource || "all",
            processedEventids: new Set(),
            isInfiniteLoading: false,
            pageState: null
        };
    }

    handleInfiniteLoad() {
        const self = this;
        const isInfiniteLoading = true;

        this.setState({ isInfiniteLoading });
        setTimeout(() => {
            self.processNewsFeed();
        }, ActivityConsts.INFINITE_LOAD_DELAY_MS);
    }

    fetchSentences(callback) {
        const { bbox, fromDate, zoomLevel, toDate, maintopic, termFilters } = this.props;
        const { pageState, filteredSource } = this.state;
        const searchValue = this.refs.filterTextInput.value;
        const pipelinekeys = constants.DATA_SOURCES.get(filteredSource).sourceValues;
        const externalsourceid = this.props.externalsourceid !== constants.DEFAULT_EXTERNAL_SOURCE ? this.props.externalsourceid : null;

        SERVICES.FetchMessageSentences(externalsourceid, bbox, zoomLevel, fromDate, toDate,
            ActivityConsts.OFFSET_INCREMENT, pageState, [maintopic].concat(Array.from(termFilters)), pipelinekeys,
            searchValue, callback);
    }

    renderDataSourceTabs(iconStyle) {
        let tabs = [];
        const { filteredSource } = this.state;

        if (filteredSource === "all") {
            for (let [source, value] of constants.DATA_SOURCES.entries()) {
                let icon = <i style={iconStyle} className={value.icon} />;
                let tab = <Tab key={source}
                    label={value.label}
                    value={source}
                    icon={icon}>
                </Tab>;

                tabs.push(tab);
            }
        } else {
            let tabSchema = constants.DATA_SOURCES.get(filteredSource);
            let icon = <i style={iconStyle} className={tabSchema.icon} />;
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

    buildElements() {
        const { elements, processedEventids } = this.state;
        let self = this;

        this.fetchSentences((error, response, body) => {
            if (!error && response.statusCode === 200 && body.data) {
                const newsFeedPage = body.data.messages.features.filter(feature => feature.properties.summary && feature.properties.summary.length && !processedEventids.has(feature.properties.messageid)).map(this.parseEvent);
                self.setState({
                    isInfiniteLoading: false,
                    processedEventIds: new Set(Array.from(processedEventids).concat(newsFeedPage.map(msg=>msg.messageid))),
                    pageState: body.data.messages.pageState,
                    elements: elements.concat(newsFeedPage)
                });
            } else {
                console.error(`[${error}] occured while processing message request`);
            }
        });
    }

    processNewsFeed() {
        const { pageState, elements } = this.state;

        //If events have already been rendered and pageState is null, then there are no more events to show
        if (pageState || !elements.length) {
            this.buildElements();
        } else {
            this.setState({
                isInfiniteLoading: false
            });
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
        this.setState(Object.assign({}, this.resetNewsFeed(), filteredSource));
        this.processNewsFeed();
    }

    resetNewsFeed() {
        return {
            elements: [], 
            filteredSource: null, 
            processedEventids: new Set(),
            isInfiniteLoading: false,
            pageState: null
        };
    }

    searchSubmit() {
        event.preventDefault();
        this.setState(Object.assign({}, this.resetNewsFeed()));
        this.processNewsFeed();
    }

    componentDidMount() {
        setTimeout(() => this.processNewsFeed(), ActivityConsts.INFINITE_LOAD_DELAY_MS);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps && prevProps.bbox &&
            this.props.bbox === prevProps.bbox &&
            this.props.zoomLevel === prevProps.zoomLevel &&
            this.props.fromDate === prevProps.fromDate &&
            this.props.toDate === prevProps.toDate &&
            this.props.maintopic === prevProps.maintopic &&
            this.props.externalsourceid === prevProps.externalsourceid &&
            Array.from(this.props.termFilters).join(',') === Array.from(prevProps.termFilters).join(',') &&
            this.props.dataSource === prevProps.dataSource) {
            
            return console.log('no prop change to issue re-render of news feed');
          }

          this.setState(Object.assign({}, this.resetNewsFeed(), {filteredSource: this.props.externalsourceid}));
          this.processNewsFeed();
    }

    translateTerm(term) {
        const { allSiteTopics } = this.props;
        const edge = fetchTermFromMap(allSiteTopics, term);

        return edge ? edge.translatedname : term;
    }

    translateTerms = terms => terms.map(this.translateTerm);

    getSelectedTopicsAndSearchValue(){
        let tags = [];
        const { maintopic, termFilters } = this.props;
        
        if(this.refs && this.refs.filterTextInput) {
            const termsInBaseLang = [maintopic].concat(Array.from(termFilters));
            tags = this.translateTerms(termsInBaseLang);
        }

        return tags;
    }

    render() {
        const { isInfiniteLoading, filteredSource, elements } = this.state;
        const { language, infiniteScrollHeight } = this.props;
        const selectedTags = this.getSelectedTopicsAndSearchValue();

        return (
            <div className="col-lg-12 news-feed-column">
                <Tabs tabItemContainerStyle={styles.tabStyle}
                    value={filteredSource}
                    id="newsFeedContainer"
                    onChange={this.sourceOnClickHandler}>
                    {this.renderDataSourceTabs(styles.iconStyle)}
                </Tabs>
                <Infinite elementHeight={ActivityConsts.ELEMENT_ITEM_HEIGHT}
                    containerHeight={infiniteScrollHeight - ActivityConsts.NEWS_FEED_SEARCH_CONTAINER_HEIGHT}
                    infiniteLoadBeginEdgeOffset={300}
                    className="infite-scroll-container"
                    onInfiniteLoad={this.handleInfiniteLoad}
                    loadingSpinnerDelegate={this.elementInfiniteLoad()}
                    isInfiniteLoading={isInfiniteLoading} >
                    {
                        elements.map(feature => {
                            const translatedEdges = this.translateTerms(feature.edges);

                         return <FortisEvent key={feature.messageid}
                                id={feature.messageid}
                                sentence={feature.summary}
                                source={feature.pipelinekey}
                                originalSource={feature.externalsourceid}
                                postedTime={feature.eventtime}
                                sentiment={feature.sentiment}
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
                </Infinite>
                <div className="panel-footer clearfix">
                    <div className="input-group">
                        <input ref="filterTextInput" type="text" placeholder="Filter News Feed .." className="form-control input-sm" />
                        <span className="input-group-btn">
                            <button onClick={this.searchSubmit} className="btn btn-default btn-sm"><i className="fa fa-search"></i>
                            </button>
                        </span>
                    </div>
                </div>
                <DialogBox ref="dialogBox" {...this.props}></DialogBox>
            </div>
        );
    }

    handleOpenDialog(item) {
        this.refs.dialogBox.open(item);
    }
}