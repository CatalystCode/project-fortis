import {DataGrid} from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminTwitterAccounts = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount() {
    this.getFlux().actions.ADMIN.load_twitter_accounts();
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  handleSave(mutatedRows, columns) {
    this.getFlux().actions.ADMIN.save_twitter_accts(this.props.siteKey, mutatedRows);
  },

  handleRemove(deletedRows) {
    this.getFlux().actions.ADMIN.remove_twitter_accts(this.props.siteKey, deletedRows);
  },

  render() {
    return (
      this.state.twitterAccounts ? 
        <DataGrid 
          rowHeight={40}
          minHeight={500}
          rowKey="consumerKey"
          uniqueKey="consumerKey"
          handleSave={this.handleSave}
          handleRemove={this.handleRemove}
          columns={this.state.twitterAccountsGridColumns}
          rows={this.state.twitterAccounts} />
        : <div />
    );
  }
});