import {DataGrid} from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminWatchlist = createReactClass({
    mixins: [FluxMixin, StoreWatchMixin],

    getInitialState() {
      return {};
    },

    componentDidMount(){
      const defaultLanguage = this.getDefaultLanguage();
      this.getFlux().actions.ADMIN.load_topics(defaultLanguage);
    },

    getDefaultLanguage() {
      return this.getFlux().store("AdminStore").getState().settings.properties.defaultLanguage;
    },

    getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
    },

    render(){
        let state = this.getFlux().store("AdminStore").getState();
        return (
         this.state.topicGridColumns.length > 0 ? 
            <DataGrid rowHeight={40}
                      minHeight={500}
                      rowKey="topicid"
                      guidAutofillColumn="topicid"
                      toolbar={null}
                      rowSelection={null}
                      columns={this.state.topicGridColumns}
                      rows={this.state.watchlist} />
            : <div />
        );
    }
});