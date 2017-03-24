import {DataGrid} from './DataGrid';
import React from 'react';
import Fluxxor from 'fluxxor';
let graph = require('fbgraph');

const FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const FacebookPagesEditor = React.createClass({
    mixins: [FluxMixin, StoreWatchMixin],

    getInitialState(){
        return {
        };
    },
    componentDidMount(){
        this.getFlux().actions.ADMIN.load_fb_pages(this.props.siteKey);
        graph.setAccessToken(this.state.settings.properties.fbToken);
    },
    validateFacebookPage(pageName){
        return new Promise(function(resolve, reject) {
            let queryString = `${pageName}`;

            let graphResponseHandler = (error, response) => {
                    if (error != null) {
                        reject(`Facebook page "${pageName}" is not valid`);
                    }
                    else
                    {
                        resolve("Valid");
                    }
            };
        
            graph.get(queryString, graphResponseHandler);
            });
    },
    getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
    },
    getColumns(){
        var facebookPageValidation = input => this.validateFacebookPage(input);

        return  [      
            {   editable: false, 
                key: "RowKey", 
                name: "Page ID",
                resizable: false
            },
            {
                editable:true,
                sortable : true,
                filterable: true,
                required: true,
                compositeKey: true, 
                resizable: true,
                validateWithPromise: facebookPageValidation,
                name: "Facebook Page ID",
                key: "pageUrl"
            },
            {
                editable: false,
                sortable : true,
                filterable: true,
                required: false,
                compositeKey: false, 
                resizable: true,
                name: "Posts Count (last 30 days)",
                key: "Count"
            },
            {
                editable: false,
                sortable : false,
                filterable: true,
                required: false,
                compositeKey: false, 
                resizable: true,
                name: "Last Updated",
                key: "LastUpdated"
            }
                ]
    },
    handleSave(mutatedRows, columns){
        this.getFlux().actions.ADMIN.save_fb_pages(this.props.siteKey, mutatedRows);
    },
    handleRemove(deletedRows){
        const reducedRows = deletedRows.map(page=>Object.assign({}, {RowKey: page.RowKey}));
        this.getFlux().actions.ADMIN.remove_fb_pages(this.props.siteKey, reducedRows);
    },
    render(){
        let state = this.getFlux().store("AdminStore").getState();

        return (
         state.locations.size > 0 ? 
            <DataGrid rowHeight={40}
                      minHeight={500}
                      rowKey="RowKey"
                      guidAutofillColumn="RowKey"
                      handleSave={this.handleSave}
                      handleRemove={this.handleRemove}
                      columns={this.getColumns()}
                      rows={state.facebookPages} />
            : <div />
        );
    }
});