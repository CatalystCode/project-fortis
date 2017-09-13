import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import Dashboard from '../components/Insights/Dashboard';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const EntryPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  propertyLiterals() {
    const { dataSource, bbox, termFilters, maintopic, externalsourceid, datetimeSelection, 
            fromDate, toDate, language, zoomLevel, settings, timespanType, 
            conjunctivetopics, heatmapTileIds, timeSeriesGraphData, popularLocations, popularTerms,
            timeSeriesCsv, popularLocationsCsv, popularTermsCsv, topSourcesCsv,
            topSources, trustedSources, fullTermList } = this.state;

    return Object.assign({}, { dataSource, maintopic, termFilters, bbox, 
                               externalsourceid, datetimeSelection, fromDate, toDate, language,
                               zoomLevel, settings, timespanType, heatmapTileIds, 
                               conjunctivetopics, timeSeriesGraphData, popularLocations, popularTerms,
                               timeSeriesCsv, popularLocationsCsv, popularTermsCsv, topSourcesCsv,
                               topSources, trustedSources, fullTermList });
  },

  render() {
    return (
    this.state.bbox.length ? 
      <div>
        <Dashboard flux={this.props.flux} 
                {...this.propertyLiterals()} />
      </div>
    : <div />
  )}
});