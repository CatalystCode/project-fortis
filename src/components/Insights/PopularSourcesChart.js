import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';
import constants from '../../actions/constants';
import Sentiment from '../Graphics/Sentiment';

export default class PopularSourcesChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeIndex: 0,
            dataProvider: [],
            colorCells: []
        };
    }

    handleClick(data, activeIndex) {
        const { dataSource, timespanType, termFilters, datetimeSelection, zoomLevel, maintopic, bbox, fromDate, toDate } = this.props;
        const { name } = data;
        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), name);
        this.setState({ activeIndex });
    }

    refreshChart(props) {
        const { topSources, externalsourceid } = props;
        let { activeIndex } = this.state;
        let colorCells = [], dataProvider = [];

        topSources.forEach((source, index) => {
            const { name, mentions, avgsentiment } = source;
            const value = mentions;
            const icon = <Sentiment showGraph={false} value={avgsentiment} />;
            if (name === externalsourceid) {
                activeIndex = index;
            }
            let color = constants.CHART_STYLE.COLORS[index];
            colorCells.push(<Cell key={0} fill={color} />);

            dataProvider.push(Object.assign({}, { value, name, icon }));
        });

        this.setState({ colorCells, dataProvider, activeIndex });
    }

    componentDidMount() {
        this.refreshChart(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.refreshChart(nextProps);
    }

    render() {
        return (
            <DoughnutChart handleClick={(data, activeIndex)=>this.handleClick(data, activeIndex)}
                fill={constants.CHART_STYLE.BG_FILL}
                data={this.state.dataProvider}
                activeIndex={this.state.activeIndex}>
                {this.state.colorCells}
            </DoughnutChart>
        );
    }
}