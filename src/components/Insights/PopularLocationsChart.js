import Fluxxor from 'fluxxor';
import React from 'react';
import DoughnutChart from '../Graphics/DoughnutChart';
import { Cell } from 'recharts';

const DEFAULT_LANGUAGE = "en";
const BG_FILL = "#30303d";
const COLORS = ['#E91E63', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#1A237E'];
const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const PopularLocationsChart = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  
  getStateFromFlux: function() {
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

 refreshChart(locations, lang){
    const state = this.getStateFromFlux();
    const edgeMap = state.allEdges.get(DEFAULT_LANGUAGE);
    let activeIndex = -1;
    const selectedLocation = state.categoryValue["name_"+state.language];
    let colorCells = [];

    let dataProvider = locations.map((location, index) => {
              const edge = edgeMap.get(location.name.toLowerCase());
              const name = edge['name_'+lang];
              let value = location.mentions;
              let color = COLORS[index];
              if(name.toLowerCase() === selectedLocation.toLowerCase()){
                activeIndex = index;
              }
              colorCells.push(<Cell key={0} fill={color}/>);

              return Object.assign({}, edge, { value, name});
    });

    this.setState({colorCells, dataProvider, activeIndex});
 },

 componentDidMount(){
    const {popularLocations, language} = this.getStateFromFlux();

    this.refreshChart(popularLocations, language);
 },

  componentWillReceiveProps(nextProps){
      const {popularLocations} = this.getStateFromFlux();

      if(this.props.datetimeSelection !== nextProps.datetimeSelection || this.props.dataSource !== nextProps.dataSource 
            || this.props.language !== nextProps.language || this.props.mainEdge !== nextProps.mainEdge){
          this.refreshChart(popularLocations, nextProps.language);
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