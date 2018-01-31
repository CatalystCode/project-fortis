import React from 'react';
import Fluxxor from 'fluxxor';
import BrowserDetection from 'react-browser-detection';
import { default as ReactDOM } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import { DataStore} from './stores/DataStore';
import { AdminStore} from './stores/AdminStore';
import { methods as DashboardActions } from './actions/Dashboard';
import { methods as AdminActions } from './actions/Admin';
import { methods as FactsActions } from './actions/Facts';
import { routes } from './routes/routes';
import UnsupportedBrowserPage from './routes/UnsupportedBrowserPage';
import constants from './actions/constants';
import 'bootstrap/dist/css/bootstrap.css';

const userProfile = constants.USER_PROFILE;

const stores = {
  DataStore: new DataStore(userProfile),
  AdminStore: new AdminStore(),
};

const flux = new Fluxxor.Flux(stores, Object.assign({}, DashboardActions, AdminActions, FactsActions));

const createElement = (Component, props) => {
  props.flux = flux;
  return <Component {...props} />
};

const app = <Router history={hashHistory} createElement={createElement} routes={routes} />;

ReactDOM.render(
  <BrowserDetection>
    {{
      chrome: () => app,
      firefox: () => app,
      default: () => <UnsupportedBrowserPage />,
    }}
  </BrowserDetection>,
  document.getElementById('app')
);
