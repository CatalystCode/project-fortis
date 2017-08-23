import { DataGrid } from './DataGrid';
import React from 'react';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const StreamEditor = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount(){
    this.getFlux().actions.ADMIN.load_streams();
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  handleSave(mutatedRows, columns){
    this.getFlux().actions.ADMIN.save_keywords(this.props.siteKey, mutatedRows);
  },
  
  handleRemove(deletedRows){
    this.getFlux().actions.ADMIN.remove_streams(this.props.siteKey, deletedRows);
  },

  render(){
    let state = this.getFlux().store("AdminStore").getState();
    
    return (
      this.state.streamGridColumns.length > 0 ? 
        <DataGrid 
          rowHeight={40}
          minHeight={500}
          rowKey="pipelineKey"
          guidAutofillColumn="pipelineKey"
          handleSave={this.handleSave}
          handleRemove={this.handleRemove}
          columns={this.state.streamGridColumns}
          rows={state.streams}
        /> : <div />
    );
  }
});