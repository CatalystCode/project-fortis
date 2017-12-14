import React from 'react';
import createReactClass from 'create-react-class';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Fluxxor from 'fluxxor';
import { UserAgentApplication, Logger } from '@cicorias/msal';

import '../styles/Global.css';
import Header from '../components/Header';
import { reactAppAdAuthority, reactAppAdClientId, reactAppAdGraphScopes } from '../config';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const AppPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  adApplication: new UserAgentApplication(
    reactAppAdClientId,
    reactAppAdAuthority,
    (errorMessage, token, error, tokenType) => {
      if (token) this.adHandleToken(token)
      else this.adHandleError(error);
    },
    {
      cacheLocation: 'localStorage',
      logger: new Logger((level, message, containsPII) => {
        const logger = level === 0 ? console.error : level === 1 ? console.warn : console.log;
        logger(`AD: ${message}`);
      }),
      useV1: true
    }
  ),

  adHandleError(error) {
    console.error(`AD: ${error}`);
  },

  adHandleToken(token) {
    const user = this.adApplication.getUser();
    this.getFlux().actions.DASHBOARD.handleAuth(user);
  },

  adLogin() {
    const self = this;

    self.adApplication.loginPopup(reactAppAdGraphScopes)
    .then((idToken) => {
      self.adApplication.acquireTokenSilent(reactAppAdGraphScopes)
      .then(self.adHandleToken)
      .catch((error) => {
        self.adApplication.acquireTokenPopup(reactAppAdGraphScopes)
        .then(self.adHandleToken)
        .catch(self.adHandleError);
      });
    })
    .catch(self.adHandleError);
  },

  adLogout() {
    this.adApplication.logout();
    this.getFlux().actions.DASHBOARD.handleAuth(null);
  },

  componentDidMount() {
    this.getFlux().actions.DASHBOARD.initializeDashboard(this.props.params.siteKey);

    const user = this.adApplication.getUser();
    if (user) {
      this.getFlux().actions.DASHBOARD.handleAuth(user);
    }
  },

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  render() {
    if (!this.state.user) {
      return this.renderLogin();
    }

    if (this.state.error) {
      return this.renderError();
    }

    if (this.state.bbox.length) {
      return this.renderApp();
    }

    return this.renderLoading();
  },

  renderLogin() {
    return (
      <div className="loadingPage">
        <a className="btn btn-primary" onClick={this.adLogin}>Click to log in.</a>
      </div>
    );
  },

  renderLogout() {
    return (
      <a onClick={this.adLogout}>Log out {this.state.user.name}</a>
    );
  },

  renderError() {
    return (
      <div className="loadingPage">
        <h1>An error occurred while loading the page: {this.state.error}</h1>
      </div>
    );
  },

  renderLoading() {
    return (
      <div className="loadingPage">
        <h1>
          Loading {this.props.params.siteKey} watcher... ({this.state.initialLoadStepsCompleted} out of {this.state.initialLoadStepsTotal} steps done)
        </h1>
      </div>
    );
  },

  renderApp() {
    return (
      <MuiThemeProvider>
        <div id="app">
          <Header
            id="header"
            flux={this.props.flux}
            {...this.props.params}
            title={this.state.title}
            logo={this.state.logo}
            category={this.props.params.siteKey}
            language={this.state.language}
            supportedLanguages={this.state.supportedLanguages}
            settings={this.state.settings}
            renderLogout={this.renderLogout}
          />
          <div id="main">
            <div id="content">
              {this.props.children}
            </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  },
});
