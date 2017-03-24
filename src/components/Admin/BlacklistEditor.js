import {DataGrid} from './DataGrid';
import React from 'react';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

const filterTermsValidation = input => {
            try{
                JSON.parse(input);
            }catch(error){
                return `${input} is not a JSON array. i.e. ["term1", "term2"]`
            }

            return false;
};

const columns = [
            {   editable: false, 
                key: "RowKey", 
                name: "Filter ID",
                resizable: false
            },
            {
                editable:true,
                sortable : true,
                filterable: true,
                required: true,
                compositeKey: true, 
                resizable: true,
                validateWith: filterTermsValidation,
                name: "Conjunctive Filter(JSON Array)",
                key: "filteredTerms"
            },
            {
                editable:true,
                sortable : true,
                filterable: true,
                required: true,
                resizable: true,
                name: "Language",
                key: "lang"
            }
];

export const BlacklistEditor = React.createClass({
    mixins: [FluxMixin, StoreWatchMixin],

    getInitialState(){
        return {
        };
    },
    componentDidMount(){
        this.getFlux().actions.ADMIN.load_blacklist(this.props.siteKey);
    },
    getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
    },
    handleSave(mutatedRows, columns){
        const reducedRows = mutatedRows.map(term => {
                const filteredTerms = JSON.parse(term.filteredTerms);
                const {lang, RowKey} = term;

                return Object.assign({}, {filteredTerms, lang, RowKey});
        });

        this.getFlux().actions.ADMIN.save_blacklist(this.props.siteKey, reducedRows);
    },
    handleRemove(deletedRows){
        this.getFlux().actions.ADMIN.remove_blacklist(this.props.siteKey, deletedRows);
    },
    render(){
        let state = this.getFlux().store("AdminStore").getState();

        return (
         this.state.locations.size > 0 ? 
            <DataGrid rowHeight={40}
                      minHeight={500}
                      rowKey="RowKey"
                      guidAutofillColumn="RowKey"
                      handleSave={this.handleSave}
                      handleRemove={this.handleRemove}
                      columns={columns}
                      rows={state.blacklist} />
            : <div />
        );
    }
});