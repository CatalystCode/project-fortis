import React from 'react';
import { Area } from 'recharts';
import moment from 'moment';
import GraphCard from '../Graphics/GraphCard';
import NoData from '../Graphics/NoData';
import constants from '../../actions/constants';
import { FromToDateFormat, doNothing } from '../../utils/Utils';
import { fetchTermFromMap, hasChanged } from './shared';
import Timeline from '../Graphics/Timeline';
import IconButton from 'material-ui/IconButton';
import NavigationRefresh from 'material-ui/svg-icons/navigation/refresh';
import ContentUndo from 'material-ui/svg-icons/content/undo';
import { fullWhite, grey800 } from 'material-ui/styles/colors';

function formatTime(dateString, toFormat) {
  const date = moment(dateString, 'YYYY-MM-DD HH:mm', true);
  return date.isValid() ? date.format(toFormat) : dateString;
}

export default class TimeSeriesGraph extends React.Component {
  constructor(props) {
    super(props);
    this.range = {};
    this.state = {
      timelineHasBeenCustomized: false,
      lines: []
    };
  }

  refreshChart(props, initialLoad) {
    const { timeSeriesGraphData, defaultLanguage, language, allSiteTopics } = props;

    const lines = timeSeriesGraphData.labels.map((label, index) => {
      const topic = fetchTermFromMap(allSiteTopics, label.name, language, defaultLanguage);
      const localTopicName = topic.translatedname;
      const color = constants.CHART_STYLE.COLORS[index];

      return <Area key={index}
        name={localTopicName.toLowerCase()}
        type="monotone"
        connectNulls={true}
        dataKey={topic.name.toLowerCase()}
        stroke={color}
        fill={color}
        isAnimationActive={false}
        strokeWidth={3}
        dot={false}
        ticksCount={5} />
    });

    const startIndex = 0, endIndex = timeSeriesGraphData.graphData.length - 1;
    this.range = { startIndex, endIndex };

    this.setState({ lines });

    if (initialLoad) {
      this.forceUpdate();
    }
  }

  formatAxisLabelDate = (time) => {
    let format;

    if (this.props.timespanType === "day") {
      format = "LT";
    } else if (this.props.timespanType === "week") {
      format = "ll";
    } else {
      format = "l";
    }

    return formatTime(time, format);
  }

  componentDidMount() {
    const initialLoad = true;
    this.refreshChart(this.props, initialLoad);
  }

  dateRangeChanged = (range, obj) => {
    const { startIndex, endIndex } = range;
    this.range = { startIndex, endIndex };

    if (!this.state.timelineHasBeenCustomized) {
      this.setState({timelineHasBeenCustomized: true});
    }
  }

  componentWillReceiveProps(nextProps) {
    if (hasChanged(this.props, nextProps)){
      this.refreshChart(nextProps);
    }
  }

  resetTimeline = () => {
    this.props.refreshDashboardFunction(false, null);
    this.setState({timelineHasBeenCustomized: false});
  }

  handleDataFetch = () => {
    const { dataSource, timespanType, bbox, selectedplace, termFilters, timeSeriesGraphData, zoomLevel, externalsourceid, maintopic } = this.props;
    const { startIndex, endIndex } = this.range;
    const fromDateSlice = timeSeriesGraphData.graphData[startIndex];
    const toDateSlice = timeSeriesGraphData.graphData[endIndex];

    if (fromDateSlice && toDateSlice) {
      const datetimeSelectionFormat = "YY-MM-DD HH:mm";
      const fromDate = formatTime(fromDateSlice.date, FromToDateFormat);
      const toDate = formatTime(toDateSlice.date, FromToDateFormat);
      const datetimeSelection = `${formatTime(fromDateSlice.date, datetimeSelectionFormat)} - ${formatTime(toDateSlice.date, datetimeSelectionFormat)}`
      const timeseriesType = constants.TIMESPAN_TYPES[timespanType].timeseriesType
      this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timeseriesType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
    }
  }

  renderActionButtons() {
    const { timelineHasBeenCustomized } = this.state;
    const actionButtonColor = timelineHasBeenCustomized ? fullWhite : grey800;
    const tooltipHint = !timelineHasBeenCustomized ? ' (Use the slider below the timeline graph above to customize the time range.)' : '';

    return [
      <IconButton key="reload-button" tooltip={`Click to reload dashboard with custom time range defined by the timeline graph above.${tooltipHint}`} onClick={timelineHasBeenCustomized ? this.handleDataFetch : doNothing}>
        <NavigationRefresh color={actionButtonColor} />
      </IconButton>,
      <IconButton key="reset-button" tooltip={`Click to reset custom time range in timeline graph above to previous value.${tooltipHint}`} onClick={timelineHasBeenCustomized ? this.resetTimeline : doNothing}>
        <ContentUndo color={actionButtonColor} />
      </IconButton>,
    ];
  }

  render() {
    const cardHeader = {
      title: 'Timeline'
    };

    if (!this.state.lines.length) {
      return (
        <GraphCard cardHeader={cardHeader}>
          <NoData />
        </GraphCard>
      );
    }

    return (
      <GraphCard cardActions={this.renderActionButtons()} cardHeader={cardHeader}>
        <Timeline fill={constants.CHART_STYLE.BG_FILL}
          data={this.props.timeSeriesGraphData.graphData.map(graphData => {
            const localizedGraphData = Object.assign({}, graphData);
            localizedGraphData.date = formatTime(graphData.date, 'lll');
            return localizedGraphData;
          })}
          dataKey="date"
          dateRangeChanged={this.dateRangeChanged}
          tickFormatter={this.formatAxisLabelDate}>
          {this.state.lines}
        </Timeline>
      </GraphCard>
    );
  }
}