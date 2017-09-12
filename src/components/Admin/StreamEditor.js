import { DataGrid } from './DataGrid';
import React from 'react';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const StreamEditor = React.createClass({
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

  render(){
    return (
      this.state.streamGridColumns.length > 0 ? 
        <DataGrid 
          rowHeight={40}
          minHeight={500}
          toolbar={null}
          rowSelection={null}
          rowKey="streamId"
          guidAutofillColumn="streamId"
          columns={this.state.streamGridColumns}
          rows={this.state.streams}
        /> : <div />
    );
  }
});