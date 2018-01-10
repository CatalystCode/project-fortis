import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import Dashboard from '../components/Insights/Dashboard';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const DashboardPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  propertyLiterals() {
    const { dataSource, bbox, termFilters, maintopic, externalsourceid, datetimeSelection,
            fromDate, toDate, language, zoomLevel, settings, timespanType, enabledStreams,
            conjunctivetopics, heatmapTileIds, timeSeriesGraphData, popularLocations, popularTerms,
            timeSeriesCsv, popularLocationsCsv, popularTermsCsv, topSourcesCsv, category,
            topSources, trustedSources, fullTermList, selectedplace } = this.getStateFromFlux();

    return Object.assign({}, { dataSource, maintopic, termFilters, bbox, enabledStreams,
                               externalsourceid, datetimeSelection, fromDate, toDate, language,
                               zoomLevel, settings, timespanType, heatmapTileIds, category,
                               conjunctivetopics, timeSeriesGraphData, popularLocations, popularTerms,
                               timeSeriesCsv, popularLocationsCsv, popularTermsCsv, topSourcesCsv,
                               topSources, trustedSources, fullTermList, selectedplace });
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