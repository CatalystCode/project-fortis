import React from 'react';
import DataSelector from './DataSelector';
import HeatMap from './Maps/HeatMap';
import SentimentTreeview from './SentimentTreeview';
import GraphCard from '../Graphics/GraphCard';
import ActivityFeed from './ActivityFeed';
import CsvExporter from './CsvExporter';
import TimeSeriesGraph from './TimeSeriesGraph';
import PopularTermsChart from './PopularTermsChart';
import PopularLocationsChart from './PopularLocationsChart';
import PopularSourcesChart from './PopularSourcesChart';
import ReactGridLayout from 'react-grid-layout';
import { defaultLayout } from './Layouts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/Insights/Dashboard.css';

let ResponsiveReactGridLayout = ReactGridLayout.Responsive;
const WidthProvider = ReactGridLayout.WidthProvider;
ResponsiveReactGridLayout = WidthProvider(ResponsiveReactGridLayout);

const DefaultToggleText = "Expand Heatmap";

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    
    this.onResizeStop = this.onResizeStop.bind(this);
    this.toggleHeatmapSize = this.toggleHeatmapSize.bind(this);

    this.state = {
      contentRowHeight: 0,
      newsfeedResizedHeight: 0,
      watchlistResizedHeight: 0,
      contentAreaHeight: 0,
      mounted: false,
      heatmapToggleText: DefaultToggleText
    };
  }

  componentDidMount() {
    const rowInitialHeight = document.getElementById("leafletMap") || { clientHeight: 0 };
    const contentAreaHeight = document.getElementById("contentArea");
    this.setState({ contentRowHeight: rowInitialHeight.clientHeight, contentAreaHeight: contentAreaHeight.clientHeight, mounted: true });
  }

  onResizeStop(item, oldItem, newItem, placeholder, e, element) {
    const height = e.toElement.clientHeight;

    const resizedItemId = newItem.i;
    const resizeStateHeightItems = ['newsfeed', 'watchlist'];
    if (resizeStateHeightItems.indexOf(resizedItemId) > -1) {
      const newState = {};
      newState[resizedItemId + 'ResizedHeight'] = height;
      this.setState(newState);
    }
  }

  toggleHeatmapSize() {
    const heatmapToggleText = this.state.heatmapToggleText === DefaultToggleText ? "Minimize Heatmap" : DefaultToggleText;
    const newsfeedResizedHeight = 0;
    const watchlistResizedHeight = 0;
    this.setState({ heatmapToggleText, newsfeedResizedHeight, watchlistResizedHeight });
  }

  filterLiterals() {
    const { dataSource, zoomLevel, flux, bbox, timespanType, termFilters, maintopic, externalsourceid, datetimeSelection, fromDate, toDate, language } = this.props;
    const defaultLanguage = this.props.settings.defaultLanguage;
    const defaultZoom = parseInt(this.props.settings.defaultZoomLevel, 10);
    const conjunctiveTermsLength = termFilters.size;

    return Object.assign({}, { zoomLevel, dataSource, conjunctiveTermsLength, defaultZoom, flux, maintopic, defaultLanguage, 
       termFilters, bbox, timespanType, externalsourceid, datetimeSelection, fromDate, toDate, language });
  }

  isHeatmapFullScreen() {
    return this.state.heatmapToggleText !== DefaultToggleText;
  }

  heatmapComponent() {
    return (
      <div key={'heatmap'} className="heatmapContainer">
        <div>
          <div id='leafletMap'></div>
          <HeatMap
            targetBbox={this.props.settings.targetBbox}
            heatmapTileIds={this.props.heatmapTileIds}
            {...this.filterLiterals() }
          />
        </div>
      </div>
    );
  }

  newsfeedComponent() {
    const { bbox } = this.props;
    const { contentAreaHeight, contentRowHeight, newsfeedResizedHeight } = this.state;

    return (
      <div key={'newsfeed'}>
        <div id="newsfeed-container">
          {bbox.length ?
            <ActivityFeed
              allSiteTopics={this.props.fullTermList}
              infiniteScrollHeight={this.isHeatmapFullScreen() ? contentAreaHeight : newsfeedResizedHeight > 0 ? newsfeedResizedHeight : contentRowHeight}
              {...this.filterLiterals() }
            />
            : undefined}
        </div>
      </div>
    );
  }

  topLocationsComponent() {
    const cardHeader = {
      title: "Popular Locations"
    };

    return (
      <div key={'locations'} className="doughnutChart">
        <GraphCard cardHeader={cardHeader}>
          <PopularLocationsChart
            popularLocations={this.props.popularLocations}
            {...this.filterLiterals() }
          />
        </GraphCard>
      </div>
    );
  }

  topTopicsComponent() {
    const cardHeader = {
      title: "Popular Topics"
    };

    return (
      <div key={'topics'} className="doughnutChart">
        <GraphCard cardHeader={cardHeader}>
          <PopularTermsChart
            allSiteTopics={this.props.fullTermList}
            popularTerms={this.props.popularTerms}
            {...this.filterLiterals() }
          />
        </GraphCard>
      </div>
    );
  }

  topSourcesComponent() {
    const cardHeader = {
      title: "Popular Sources"
    };

    return (
      <div key={'sources'} className="doughnutChart">
        <GraphCard cardHeader={cardHeader}>
          <PopularSourcesChart
            topSources={this.props.topSources}
            {...this.filterLiterals() }
          />
        </GraphCard>
      </div>
    );
  }

  refreshDashboard(includeCsv) {
    const { dataSource, timespanType, termFilters, datetimeSelection, zoomLevel, maintopic, bbox, fromDate, toDate, externalsourceid } = this.filterLiterals();
    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, includeCsv);
  }

  timelineComponent() {
    return (
      <div key={'timeline'}>
          <TimeSeriesGraph
            allSiteTopics={this.props.fullTermList}
            refreshDashboardFunction={()=>this.refreshDashboard()}
            timeSeriesGraphData={this.props.timeSeriesGraphData}
            {...this.filterLiterals() }
          />
      </div>
    );
  }

  watchlistComponent() {
    const { contentAreaHeight, contentRowHeight, watchlistResizedHeight } = this.state;

    return (
      <div key={'watchlist'}>
        <GraphCard>
          <SentimentTreeview
            conjunctivetopics={this.props.conjunctivetopics}
            allSiteTopics={this.props.fullTermList}
            height={this.isHeatmapFullScreen() ? contentAreaHeight : (watchlistResizedHeight > 0) ? watchlistResizedHeight : contentRowHeight}
            {...this.filterLiterals() }
          />
        </GraphCard>
      </div>
    );
  }

  renderGridCards() {
    return this.isHeatmapFullScreen()
      ? [this.watchlistComponent(), this.heatmapComponent(), this.newsfeedComponent()]
      : [this.topLocationsComponent(), this.topTopicsComponent(), this.topSourcesComponent(), this.timelineComponent(), this.watchlistComponent(), this.heatmapComponent(), this.newsfeedComponent()];
  }

  render() {
    return (
      <div>
        <div className="app-container">
          <div className="container-fluid">
            <DataSelector
              heatmapToggleText={this.state.heatmapToggleText}
              toggleHeatmapSize={this.toggleHeatmapSize}
              {...this.filterLiterals() }
            />
            <CsvExporter
              csvs={[
                {name: 'Timeseries', url: this.props.timeSeriesCsv},
                {name: 'Top locations', url: this.props.popularLocationsCsv},
                {name: 'Top terms', url: this.props.popularTermsCsv},
                {name: 'Top sources', url: this.props.topSourcesCsv},
              ]}
              fetchCsvs={() => this.refreshDashboard(true)}
            />
            <div className="row" id="contentArea">
              <div className="dashboard-grid">
                <ResponsiveReactGridLayout
                  measureBeforeMount={false}
                  className="layout"
                  isDraggable={false}
                  layouts={this.isHeatmapFullScreen() ? defaultLayout.layoutCollapsed : defaultLayout.layout}
                  cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
                  rowHeight={28}
                  onResizeStop={this.onResizeStop}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  useCSSTransforms={this.state.mounted}>
                    {this.renderGridCards()}
                </ResponsiveReactGridLayout>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}