import Fluxxor from 'fluxxor';
import React from 'react';
import {Line} from 'recharts';
import moment from 'moment';
import Timeline from '../Graphics/Timeline';

const BG_FILL = "#30303d";
const DEFAULT_LANGUAGE = "en";
const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const TimeSeriesGraph = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  
  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  getInitialState(){
      return {
          lines: []
      };
  },

 refreshChart(graphDataset){
    const state = this.getStateFromFlux();
    const {colorMap, language} = state;
    let lines = [];
    const edgeMap = state.allEdges.get(DEFAULT_LANGUAGE);

    if(graphDataset && graphDataset.labels && graphDataset.graphData && colorMap){
        //this.trendingTimeSeries.dataProvider = graphDataset.graphData;
        if(graphDataset.labels){
            graphDataset.labels.filter(label=>label.name.length > 1 && edgeMap.has(label.name.toLowerCase()))
                               .forEach((label, index) => {
                                            const edge = edgeMap.get(label.name.toLowerCase());
                                            let name = edge['name_'+language];
                                            lines.push(<Line key={index} name={name} type="linear" connectNulls={true} dataKey={edge.name} stroke={colorMap.get(edge.name)} strokeWidth={3} dot={false} ticksCount={5}/>);
            });
        }
    }

    this.setState({lines});
 },

 hasChanged(nextProps, propertyName){
      if(Array.isArray(nextProps[propertyName])){
          return nextProps[propertyName].join(",") !== this.props[propertyName].join(",");
      }

      if(this.props[propertyName] && nextProps[propertyName] && nextProps[propertyName] !== this.props[propertyName]){
          return true;
      }

      return false;
 },

 dateFormat (time) {
     let validDatetimeTypes = ["days", "customDate"];
     let format = validDatetimeTypes.indexOf(this.props.timespanType || "") > -1 ? "h:mm a" : this.props.timespanType === "weeks" ? "ddd h a": "MMM-DD";
    return moment(time).format(format);
 },

 componentDidMount(){
    const {timeSeriesGraphData} = this.getStateFromFlux();
    this.refreshChart(timeSeriesGraphData);
 },

 componentWillReceiveProps(nextProps){
    const hasTimeSpanChanged = this.hasChanged(nextProps, "timespan");
    const {timeSeriesGraphData} = this.getStateFromFlux();

    if((this.hasChanged(nextProps, "mainEdge") && nextProps.edgeType === "Term") || hasTimeSpanChanged || this.hasChanged(nextProps, "dataSource") || this.hasChanged(nextProps, "language")){
        this.refreshChart(timeSeriesGraphData);
    }
 },
  
 render() {
    const {timeSeriesGraphData} = this.getStateFromFlux();

    return (
        <Timeline fill={BG_FILL} 
                  data={timeSeriesGraphData.graphData} 
                  dataKey="date" 
                  tickFormatter={this.dateFormat}>
            {this.state.lines}
        </Timeline>
     );
   }
 });