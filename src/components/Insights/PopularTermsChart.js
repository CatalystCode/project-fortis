import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';
import { fetchTermFromMap, hasChanged } from './shared';
import Sentiment from '../Graphics/Sentiment';
import constants from '../../actions/constants';

export default class PopularTermsChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeIndex: 0,
            dataProvider: [],
            colorCells: []
        };
    }

    handleClick(data) {
        const { dataSource, bbox, timespanType, termFilters, datetimeSelection, zoomLevel, externalsourceid, fromDate, toDate } = this.props;

        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, data.defaultName, bbox, zoomLevel, Array.from(termFilters), externalsourceid);
    }

    refreshChart(props) {
        const { allSiteTopics, popularTerms, defaultLanguage, maintopic, language } = props;
        let activeIndex = -1;
        let colorCells = [], dataProvider = [];

        popularTerms.forEach((term, index) => {
            const edge = fetchTermFromMap(allSiteTopics, term.name, language, defaultLanguage);

            if (edge.name.toLowerCase() === maintopic.toLowerCase()) {
                activeIndex = index;
            }

            const value = term.mentions;
            const color = constants.CHART_STYLE.COLORS[index];
            const name = edge.translatedname;
            const defaultName = term.name;

            colorCells.push(<Cell key={0} fill={color} />);

            dataProvider.push(Object.assign({}, { value, name, defaultName }));
        });

        this.setState({ colorCells, dataProvider, activeIndex });
    }

    hasChanged(nextProps, propertyName) {
        if (Array.isArray(nextProps[propertyName])) {
            return nextProps[propertyName].join(",") !== this.props[propertyName].join(",");
        }

        if (this.props[propertyName] && nextProps[propertyName] && nextProps[propertyName] !== this.props[propertyName]) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.refreshChart(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (hasChanged(this.props, nextProps)) {
            this.refreshChart(nextProps);
        }
    }

    render() {
        return (
            <DoughnutChart handleClick={data=>this.handleClick(data)}
                fill={constants.CHART_STYLE.BG_FILL}
                language={this.props.language}
                data={this.state.dataProvider}
                activeIndex={this.state.activeIndex}>
                {this.state.colorCells}
            </DoughnutChart>
        );
    }
}