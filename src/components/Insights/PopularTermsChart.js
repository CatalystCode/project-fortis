import Fluxxor from 'fluxxor';
import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

const DEFAULT_LANGUAGE = "en";
const BG_FILL = "#30303d";

export const PopularTermsChart = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  
  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  getInitialState(){
      return {
          activeIndex: 0,
          dataProvider: [],
          colorCells: []
      };
  },

  handleClick(data, index) {
    const {datetimeSelection, timespanType, dataSource} = this.state;
  	this.getFlux().actions.DASHBOARD.reloadVisualizationState(this.props.siteKey, datetimeSelection, timespanType, dataSource, data);
  },

 refreshChart(summaryTerms){
    const state = this.getStateFromFlux();
    const edgeMap = state.allEdges.get(DEFAULT_LANGUAGE);
    const selectedTopic = state.categoryValue["name_"+state.language];
    let activeIndex = -1;
    let colorCells = [];

    if(summaryTerms){
        let dataProvider = summaryTerms.map((term, index) => {
            const edge = edgeMap.get(term.name.toLowerCase());
            let name = edge['name_'+state.language];
            if(name.toLowerCase() === selectedTopic.toLowerCase()){
                activeIndex = index;
            }
            let value = term.mentions;
            let color = state.colorMap.get(edge.name);
            colorCells.push(<Cell key={0} fill={color}/>);
            
            return Object.assign({}, edge, { value, name});
        });

        this.setState({colorCells, dataProvider, activeIndex});
    }
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

 componentDidMount(){
    const {popularTerms} = this.getStateFromFlux();

    this.refreshChart(popularTerms);
 },

 componentWillReceiveProps(nextProps){
    const {popularTerms} = this.getStateFromFlux();

    if(this.props.datetimeSelection !== nextProps.datetimeSelection || this.props.dataSource !== nextProps.dataSource 
            || this.props.language !== nextProps.language || this.props.mainEdge !== nextProps.mainEdge){
        this.refreshChart(popularTerms);
    }
 },

 render() { 
    return (
        <DoughnutChart handleClick={this.handleClick} 
                       fill={BG_FILL} 
                       language={this.props.language}
                       data={this.state.dataProvider}
                       activeIndex={this.state.activeIndex}>
            {this.state.colorCells}
        </DoughnutChart>
     );
   }
});