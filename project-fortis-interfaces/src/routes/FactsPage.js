import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import { FactsList } from '../components/Facts/FactsList';
import '../styles/Facts/Facts.css';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const FactsPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  render() {
    return (
      <div className="report">
        <FactsList {...this.getStateFromFlux()} flux={this.props.flux} />
      </div>
    );
  }
});