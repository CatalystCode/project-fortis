import { DataGrid } from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

function getValidatedTermFilters(termFilters) {
  termFilters.map(termFilter => {
    try {
      termFilter.filteredTerms = JSON.parse(termFilter.filteredTerms);
    } catch (error) {
      termFilter.filteredTerms = [];
    }
  });

  return termFilters;
}

export const BlacklistEditor = createReactClass({
    mixins: [FluxMixin, StoreWatchMixin],

    getInitialState() {
      return {};
    },

    componentDidMount() {
      this.getFlux().actions.ADMIN.load_blacklist();
    },

    getStateFromFlux() {
      return this.getFlux().store("AdminStore").getState();
    },

    handleSave(rows) {
      const reducedRows = getValidatedTermFilters(rows);
      this.getFlux().actions.ADMIN.save_blacklist(reducedRows);
    },

    handleRemove(rows) {
      this.getFlux().actions.ADMIN.remove_blacklist(rows);
    },

    render() {
      let state = this.getFlux().store("AdminStore").getState();

      return (
        <DataGrid 
          rowHeight={40}
          minHeight={500}
          rowKey="id"
          guidAutofillColumn="id"
          handleSave={this.handleSave}
          handleRemove={this.handleRemove}
          columns={this.state.blacklistColumns}
          rows={state.blacklist} />
      );
    }
});