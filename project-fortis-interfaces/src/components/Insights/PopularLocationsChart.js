import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import NoData from '../Graphics/NoData';
import { Cell } from 'recharts';
import constants from '../../actions/constants';
import { hasChanged } from './shared';

export default class PopularLocationsChart extends React.Component {
  handleClick = (data) => {
    const { placeid, centroid, bbox, name } = data;
    const { dataSource, timespanType, termFilters, defaultZoom, datetimeSelection, maintopic, externalsourceid, fromDate, toDate } = this.props;

    const place = { placeid: placeid, placecentroid: centroid, name: name, placebbox: bbox };

    this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, defaultZoom, Array.from(termFilters), externalsourceid, null, place);
  }

  buildChart() {
    const { popularLocations, selectedplace } = this.props;
    const selectedWofId = selectedplace && selectedplace.placeid;

    let activeIndex = -1;
    const colorCells = [];
    const dataProvider = [];

    popularLocations.forEach((location, index) => {
      const { name, mentions, bbox, placeid, centroid } = location;

      if (placeid === selectedWofId) {
        activeIndex = index;
      }

      colorCells.push(<Cell key={0} fill={constants.CHART_STYLE.COLORS[index]} />);
      dataProvider.push({ value: mentions, name, bbox, placeid, centroid });
    });

    return { colorCells, dataProvider, activeIndex };
  }

  shouldComponentUpdate(nextProps) {
    return hasChanged(this.props, nextProps);
  }

  render() {
    const { colorCells, activeIndex, dataProvider } = this.buildChart();
    const { language } = this.props;

    if (!colorCells || !colorCells.length) {
      return <NoData />;
    }

    return (
      <DoughnutChart
        handleClick={this.handleClick}
        fill={constants.CHART_STYLE.BG_FILL}
        language={language}
        data={dataProvider}
        activeIndex={activeIndex}
      >
        {colorCells}
      </DoughnutChart>
    );
  }
}