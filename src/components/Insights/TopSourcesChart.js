import Fluxxor from 'fluxxor';
import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Actions } from '../../actions/Actions';
import { Cell } from 'recharts';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

const BG_FILL = "#30303d";
const COLORS = ['#EE2E2F', '#008C48', '#185AA9', '#F47D23', '#662C91', '#A21D21'];
const STYLES = {
  sourceLogo: {
    color: "#337ab7"
  }
};

export const TopSourcesChart = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  getInitialState(){
    this.status = 'unloaded';

    return {
      activeIndex: 0,
      dataProvider: [],
      colorCells: []
    };
  },

  initializeChart() {
    const { dataSource, siteKey, datetimeSelection, timespanType } = this.props;
    const selectedTerm = this.props.mainEdge;
    this.status = 'loading';

    this.getFlux().actions.DASHBOARD.loadPopularSources(siteKey, datetimeSelection, timespanType, selectedTerm, dataSource);
  },

  handleClick(data, index) {
    const { datetimeSelection, timespanType, dataSource } = this.state;
  	this.getFlux().actions.DASHBOARD.reloadVisualizationState(this.props.siteKey, datetimeSelection, timespanType, dataSource, data);
  },

  refreshChart() {
    const { originalSource, topSources } = this.getStateFromFlux();
    let activeIndex = -1;
    this.status = 'loaded';
    const colorCells = [];

    if (topSources) {
      const dataProvider = topSources.map((source, index) => {
        const dataSourceSchema = Actions.DataSourceLookup(source.Source);
        const icon = <i style={STYLES.sourceLogo} className={`${dataSourceSchema.icon} fa-1x`}></i>;
        const name = source.Name;
        const color = COLORS[index];
        const value = source.Count;

        if (name.toLowerCase() === originalSource.toLowerCase()) {
          activeIndex = index;
        }

        colorCells.push(<Cell key={0} fill={color}/>);

        return Object.assign({}, source, { value, name, icon, type: "Source"});
      });

      this.setState({colorCells, dataProvider, activeIndex, topSources});
    }
  },

  componentWillReceiveProps(nextProps) {
    const {topSources} = this.getStateFromFlux();

    if (nextProps.mainEdge && this.status === 'unloaded') {
      this.initializeChart();
    } else if (this.props.mainEdge !== nextProps.mainEdge || this.props.originalSource !== nextProps.originalSource || (this.status === 'loading' && topSources.length > 0) || (this.props.datetimeSelection !== nextProps.datetimeSelection) || this.props.dataSource !== nextProps.dataSource) {
      this.refreshChart();
    }
  },

  render() {
    return (
      <DoughnutChart
        handleClick={this.handleClick}
        fill={BG_FILL}
        language={this.props.language}
        data={this.state.dataProvider}
        activeIndex={this.state.activeIndex}
      >
        {this.state.colorCells}
      </DoughnutChart>
     );
  }
});