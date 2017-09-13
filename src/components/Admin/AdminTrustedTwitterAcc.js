import {DataGrid} from './DataGrid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminTrustedTwitterAcc = createReactClass({
    mixins: [FluxMixin, StoreWatchMixin],

    componentDidMount(){
        this.getFlux().actions.ADMIN.load_trusted_twitter_accts(this.props.siteKey);
    },
    getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
    },
    handleSave(mutatedRows, columns){
        this.getFlux().actions.ADMIN.save_trusted_twitter_accts(this.props.siteKey, mutatedRows);
    },
    handleRemove(deletedRows){
        const reducedRows = deletedRows.map(page=>Object.assign({}, {RowKey: page.RowKey}));
        this.getFlux().actions.ADMIN.remove_trusted_twitter_accts(this.props.siteKey, reducedRows);
    },
    getColumns() {
        return [
            {
                editable: false,
                key: "RowKey",
                name: "Page ID",
                resizable: false
            },
            {
                editable: true,
                sortable: true,
                required: true,
                filterable: false,
                resizable: true,
                name: "Twitter Account Id",
                key: "acctUrl"
            }
        ]
    },
    render(){
        return (
          this.state.trustedTwitterAccounts ? 
            <DataGrid rowHeight={40}
                      minHeight={500}
                      rowKey="RowKey"
                      guidAutofillColumn="RowKey"
                      handleSave={this.handleSave}
                      handleRemove={this.handleRemove}
                      columns={this.getColumns()}
                      rows={this.state.trustedTwitterAccounts} />
            : <div />
        );
    }
});