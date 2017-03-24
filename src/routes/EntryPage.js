import React from 'react';
import Fluxxor from 'fluxxor';
import {Dashboard} from '../components/Insights/Dashboard';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const EntryPage = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount(){
      this.getFlux().actions.DASHBOARD.initializeDashboard(this.props.params.siteKey);
  },
  getStateFromFlux: function() {
    return this.getFlux().store("DataStore").getState();
  },
  render() {
    return (
    this.state.settings.properties ? 
      <div>
        <Dashboard flux={this.props.flux} 
                {...this.props.params} />
      </div>
    : <div />
  )}
});
