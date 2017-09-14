import { DataGrid } from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const StreamEditor = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getInitialState() {
    return {};
  },

  componentDidMount() {
    this.getFlux().actions.ADMIN.load_streams();
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  handleSave(streams) {
    if (streams.constructor !== Array) streams = [streams];
    this.getFlux().actions.ADMIN.save_streams(streams);
  },

  render(){
    return (
      this.state.streamColumns.length > 0 ? 
        <DataGrid 
          rowHeight={40}
          minHeight={500}
          toolbar={null}
          rowSelection={null}
          rowKey="streamId"
          guidAutofillColumn="streamId"
          columns={this.state.streamColumns}
          rows={this.state.streams}
          handleSave={this.handleSave}
        /> : <div />
    );
  }
});