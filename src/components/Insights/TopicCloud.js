import React, { Component } from 'react';
import { fetchTermFromMap, hasChanged } from './shared';
import WordCloud from '../Graphics/WordCloud';
import ReactTooltip from 'react-tooltip'
import numeralLibs from 'numeral';
import { getSentimentAttributes } from './shared';

const DefaultMinSize = 12;
const DefaultMaxSize = 35;

const styles = {
    margin: '0px 3px',
    verticalAlign: 'middle',
    cursor: 'pointer',
    display: 'inline-block'
};

const selectedStyle = {
    fontWeight: 500,
    textDecoration: 'underline'
};

export default class TopicCloud extends Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.customRenderer = this.customRenderer.bind(this);
        this.state = {
            selectedTopic: "",
            dataProvider: []
        };
    }

    onSelectTopic(topic) {
        this.setState({
            selectedTopic: topic,
        });
    }

    customRenderer(tag, size, color) {
        const fontSize = size + 'px';
        const { selectedTopic } = this.state;
        const key = tag.key || tag.value;
        const valueText = numeralLibs(tag.count).format(tag.count > 1000 ? '+0.0a' : '0a')

        let style = Object.assign({}, styles, { color, fontSize });
        const sentimentClassName = `material-icons sentimentIcon ${tag.style}Icon`;
        const sentimentIcon = <span className={sentimentClassName} style={{fontSize}}>{tag.icon}</span>;
        const tooltipStyle = {fontWeight: 800, color: '#000'};
        const tooltipValueStyle = {color: '#000'};

        const tooltip = <span style={tooltipValueStyle}><span style={tooltipStyle}>{tag.value}</span> - {valueText} Mentions</span>;
        if (tag.value.toLowerCase() === selectedTopic.toLowerCase()) {
            style = Object.assign({}, style, selectedStyle);
        }

        return <span key={`${key}-container`}>
                    <span data-tip
                        data-for={`tip-${tag.value}`}
                        className='tag-cloud-tag'
                        style={style}
                        key={key}>{sentimentIcon}{tag.value}
                    </span>
                    <ReactTooltip key={`tip-${tag.value}`}
                        id={`tip-${tag.value}`}
                        type={tag.tooltip}>
                        <span>{tooltip}</span>
                    </ReactTooltip>
                </span>;
    }

    refreshChart(props) {
        const { allSiteTopics, popularTerms, defaultLanguage, maintopic, language } = props;
        let dataProvider = [];
        let { selectedTopic } = this.state;

        popularTerms.forEach((term, index) => {
            const edge = fetchTermFromMap(allSiteTopics, term.name, language, defaultLanguage);

            if (edge.name.toLowerCase() === maintopic.toLowerCase()) {
                selectedTopic = edge.translatedname;
            }

            const avgsentiment = term.avgsentiment;
            const value = edge.translatedname;
            const defaultName = term.name;
            const count = term.mentions;
            const { color, tooltip, style, icon } = getSentimentAttributes(avgsentiment);

            dataProvider.push(Object.assign({}, { avgsentiment, tooltip, style, icon, color, value, count, defaultName }));
        });

        this.setState({ dataProvider, selectedTopic });
    }

    componentDidMount() {
        this.refreshChart(this.props);
    }

    handleClick(data) {
        const { dataSource, bbox, timespanType, termFilters, datetimeSelection, zoomLevel, externalsourceid, fromDate, toDate, selectedplace } = this.props;

        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, dataSource, data.defaultName, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
    }

    componentWillReceiveProps(nextProps) {
        if (hasChanged(this.props, nextProps)) {
            this.refreshChart(nextProps);
        }
    }

    render() {
        return (
            <div>
                {this.state.dataProvider.length ?
                    <WordCloud
                        words={this.state.dataProvider}
                        minSize={DefaultMinSize}
                        maxSize={DefaultMaxSize}
                        customRenderer={this.customRenderer}
                        onClick={this.handleClick}
                    /> : undefined
                }
                <div>
                    <ReactTooltip />
                </div>
            </div>
        );
    }
}
