import { DataGrid } from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import constants from '../../actions/constants';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const TrustedSources = createReactClass({
    mixins: [FluxMixin, StoreWatchMixin],

    componentDidMount() {
      const pipelineKeys = this.getAllPipelineKeys();
      this.getFlux().actions.ADMIN.load_trusted_sources(pipelineKeys);
    },

    getAllPipelineKeys() {
      return constants.DATA_SOURCES.get('all').sourceValues;
    },

    getStateFromFlux() {
      return this.getFlux().store("AdminStore").getState();
    },

    handleSave(rows) {
      rows.map(row => this.appendRowKey(row));
      this.getFlux().actions.ADMIN.save_trusted_sources(rows);
    },

    appendRowKey(source) {
      return source.rowKey = source.pipelinekey + ',' + source.externalsourceid + ',' + source.sourcetype + ',' + source.rank;
    },

    handleRemove(rows) {
      this.getFlux().actions.ADMIN.remove_trusted_sources(rows);
    },

    render() {
      const state = this.getFlux().store("AdminStore").getState();

      return (
        this.state.trustedSourcesColumns ? 
          <DataGrid 
            rowHeight={40}
            minHeight={500}
            rowKey="rowKey"
            handleSave={this.handleSave}
            handleRemove={this.handleRemove}
            columns={this.state.trustedSourcesColumns}
            rows={state.trustedSources} />
          : <div />
      );
    }
});