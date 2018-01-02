import React from 'react';
import createReactClass from 'create-react-class';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Fluxxor from 'fluxxor';
import { UserAgentApplication, Logger } from 'msal';

import '../styles/Global.css';
import Header from '../components/Header';
import { reactAppAdClientId } from '../config';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

const TokenStoreKey = 'Fortis.AD.Token';
const AdScopes = ['openid'];

export const AppPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  adApplication: reactAppAdClientId ? new UserAgentApplication(
    reactAppAdClientId,
    null,
    (errorMessage, token, error, tokenType) => {
      if (token) {
        this.adHandleToken(token);
      } else {
        this.adHandleError(error);
      }
    },
    {
      cacheLocation: 'localStorage',
      logger: new Logger((level, message, containsPII) => {
        const logger = level === 0 ? console.error : level === 1 ? console.warn : console.log;
        logger(`AD: ${message}`);
      })
    }
  ) : null,

  adHandleError(error) {
    console.error(`AD: ${error}`);
    localStorage.removeItem(TokenStoreKey);
  },

  adHandleToken(token) {
    const user = this.adApplication.getUser();
    localStorage.setItem(TokenStoreKey, token);
    this.getFlux().actions.DASHBOARD.handleAuth({ user, token });
  },

  adLogin() {
    const self = this;

    self.adApplication.loginPopup(AdScopes)
    .then((idToken) => {
      self.adApplication.acquireTokenSilent(AdScopes)
      .then(self.adHandleToken)
      .catch((error) => {
        self.adApplication.acquireTokenPopup(AdScopes)
        .then(self.adHandleToken)
        .catch(self.adHandleError);
      });
    })
    .catch(self.adHandleError);
  },

  adLogout() {
    this.adApplication.logout();
    localStorage.removeItem(TokenStoreKey);
    this.getFlux().actions.DASHBOARD.handleAuth(null);
  },

  componentDidMount() {
    if (this.adApplication) {
      const user = this.adApplication.getUser();
      const token = localStorage.getItem(TokenStoreKey);
      if (user && token) {
        this.getFlux().actions.DASHBOARD.handleAuth({ user, token });
      }
    } else {
      console.warn('!!!!!!!!!!!! No Active Directory Client Id configured; auth is disabled !!!!!!!!!!!!');
    }

    this.getFlux().actions.DASHBOARD.initializeDashboard(this.props.params.siteKey);
  },

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  render() {
    if (this.adApplication && (!this.state.authInfo || !this.state.authInfo.user || !this.state.authInfo.token)) {
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
    const userName = this.state.authInfo && this.state.authInfo.user && this.state.authInfo.user.name;
    return (
      <a onClick={this.adLogout}>Log out {userName}</a>
    );
  },

  renderError() {
    return (
      <div className="loadingPage">
        <h1>An error occurred while loading the page: {this.state.error.message}</h1>
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
            logoutCallback={this.adApplication ? this.adLogout : null}
            userName={this.state.authInfo && this.state.authInfo.user && this.state.authInfo.user.name}
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
