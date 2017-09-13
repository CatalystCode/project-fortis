import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';
import constants from '../../actions/constants';
import { hasChanged } from './shared';

export default class PopularLocationsChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeIndex: -1,
            dataProvider: [],
            selectedWofId: null,
            colorCells: []
        };
    }

    handleClick(data, activeIndex) {
        const { dataSource, timespanType, termFilters, datetimeSelection, zoomLevel, maintopic, externalsourceid, fromDate, toDate } = this.props;
        const { placeid, bbox } = data;
        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid);
        this.setState({ activeIndex: activeIndex, selectedWofId: placeid });
    }

    refreshChart(props) {
        const { popularLocations } = props;
        let { activeIndex,selectedWofId } = this.state;
        let colorCells = [], dataProvider = [];

        popularLocations.forEach((location, index) => {
            const { name, mentions, bbox, placeid } = location;
            const value = mentions;
            if (placeid === selectedWofId) {
                activeIndex = index;
            }
            let color = constants.CHART_STYLE.COLORS[index];
            colorCells.push(<Cell key={0} fill={color} />);

            dataProvider.push(Object.assign({}, { value, name, bbox, placeid }));
        });

        this.setState({ colorCells, dataProvider, activeIndex });
    }

    componentDidMount() {
        this.refreshChart(this.props);
    }

    componentWillReceiveProps(nextProps) {
      if(hasChanged(this.props, nextProps)) { 
        this.refreshChart(nextProps);
      }
    }

    render() {
        return (
            <DoughnutChart handleClick={(data, activeIndex)=>this.handleClick(data, activeIndex)}
                fill={constants.CHART_STYLE.BG_FILL}
                language={this.props.language}
                data={this.state.dataProvider}
                activeIndex={this.state.activeIndex}>
                {this.state.colorCells}
            </DoughnutChart>
        );
    }
}