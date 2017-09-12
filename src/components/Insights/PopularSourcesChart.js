import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';
import constants from '../../actions/constants';
import Sentiment from '../Graphics/Sentiment';
import { hasChanged } from './shared';

export default class PopularSourcesChart extends React.Component {
    constructor(props) {
        super(props);

        this.onPieEnter = this.onPieEnter.bind(this);
        this.state = {
            activeIndex: -1,
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
            if (name === externalsourceid) {
                activeIndex = index;
            }
            let color = constants.CHART_STYLE.COLORS[index];
            colorCells.push(<Cell key={0} fill={color} />);

            dataProvider.push(Object.assign({}, { value, name }));
        });

        this.setState({ colorCells, dataProvider, activeIndex });
    }

    componentDidMount() {
        this.refreshChart(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (hasChanged(this.props, nextProps)) {
            this.refreshChart(nextProps);
        }
    }

    onPieEnter(data, index) {
        this.setState({
          activeIndex: index,
        });
    }

    render() {
        return (
            <DoughnutChart handleClick={(data, activeIndex) => this.handleClick(data, activeIndex)}
                fill={constants.CHART_STYLE.BG_FILL}
                data={this.state.dataProvider}
                onMouseEnter={this.onPieEnter}
                activeIndex={this.state.activeIndex}>
                {this.state.colorCells}
            </DoughnutChart>
        );
    }
}