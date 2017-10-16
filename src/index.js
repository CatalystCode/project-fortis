import {DataStore} from './stores/DataStore';
import {AdminStore} from './stores/AdminStore';
import {methods as DashboardActions} from './actions/Dashboard';
import {methods as AdminActions} from './actions/Admin';
import {methods as FactsActions} from './actions/Facts';
import Fluxxor from 'fluxxor';
import React from 'react';
import {default as ReactDOM} from "react-dom";
import { Router, hashHistory } from 'react-router';
import {routes} from './routes/routes';
import constants from './actions/constants';
import 'bootstrap/dist/css/bootstrap.css';

let userProfile = constants.USER_PROFILE;

let stores = {
  DataStore: new DataStore(userProfile),
  AdminStore: new AdminStore(),
};

let flux = new Fluxxor.Flux(stores, Object.assign({}, DashboardActions, AdminActions, FactsActions));

const createElement = (Component, props) => {
    props.flux = flux;
    return <Component {...props} />
};

ReactDOM.render((<Router history={hashHistory}
                         createElement={createElement} 
                         routes={routes} />), 
                  document.getElementById('app'));
