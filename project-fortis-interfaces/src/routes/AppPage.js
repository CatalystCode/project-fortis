import React from 'react';
import Button from 'react-bootstrap/lib/Button'
import createReactClass from 'create-react-class';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Fluxxor from 'fluxxor';
import { UserAgentApplication, Logger } from 'msal';
import initial from 'lodash/initial';
import first from 'lodash/first';
import last from 'lodash/last';
import Header from '../components/Header';
import { changeCategory } from '../routes/routes';
import { reactAppAdClientId, reactAppAdTokenStoreKey } from '../config';
import '../styles/Global.css';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

const AdScopes = ['openid', 'profile'];

class CategoryLink extends React.Component {
  onClick = () => {
    changeCategory(this.props.category);
  }

  render() {
    return (
      <em>
        <a onClick={this.onClick}>
          {this.props.category}
        </a>
      </em>
    );
  }
}

class JoinedList extends React.Component {
  render() {
    const { items, joinWord, joinToken } = this.props;

    if (items.length === 0) {
      return null;
    }

    if (items.length === 1) {
      return first(items);
    }

    const joinedItems = [];
    initial(items).forEach(item => {
      joinedItems.push(item);
      joinedItems.push(<span>{ joinToken } </span>);
    });
    joinedItems.pop();
    joinedItems.push(<span> { joinWord } </span>);
    joinedItems.push(last(items));

    return <span>{ joinedItems }</span>;
  }
}

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
    localStorage.removeItem(reactAppAdTokenStoreKey);
  },

  adHandleToken(token) {
    const user = this.adApplication.getUser();
    localStorage.setItem(reactAppAdTokenStoreKey, token);
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
    localStorage.removeItem(reactAppAdTokenStoreKey);
    this.getFlux().actions.DASHBOARD.handleAuth(null);
  },

  componentDidMount() {
    if (this.adApplication) {
      const user = this.adApplication.getUser();
      const token = localStorage.getItem(reactAppAdTokenStoreKey);
      if (user && token) {
        this.getFlux().actions.DASHBOARD.handleAuth({ user, token });
      }
    } else {
      console.warn('!!!!!!!!!!!! No Active Directory Client Id configured; auth is disabled !!!!!!!!!!!!');
    }

    if (this.props.params.sharedViewState) {
      this.loadDashboardFromShareLink();
    } else {
      this.loadDefaultDashboard();
    }
  },

  loadDefaultDashboard() {
    this.getFlux().actions.DASHBOARD.initializeDashboard(this.props.params.category);
  },

  loadDashboardFromShareLink() {
    let dataStore;
    try {
      dataStore = JSON.parse(atob(decodeURIComponent(this.props.params.sharedViewState)));
    } catch (err) {
      return this.getFlux().actions.DASHBOARD.handleLoadSharedDashboardError(err);
    }

    const {
      fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic,
      bbox, zoomLevel, conjunctivetopics, externalsourceid, selectedplace,
      category
    } = dataStore;
    const includeCsv = false;

    this.getFlux().actions.DASHBOARD.initializeDashboard(category, () => {
      this.getFlux().actions.DASHBOARD.reloadVisualizationState(
        fromDate, toDate, datetimeSelection, timespanType, dataSource, maintopic,
        bbox, zoomLevel, conjunctivetopics, externalsourceid, includeCsv, selectedplace, () => {
          this.props.router.push(category ? `/dashboard/${category}` : '/dashboard');
        }, true);
    });
  },

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  didAuthFail() {
    const { error } = this.state;

    if (!error) {
      return false;
    }

    return error.code === 401 || error.message.indexOf('Unknown user') !== -1;
  },

  isAuthAvailable() {
    const { authInfo } = this.state;

    return authInfo && authInfo.token;
  },

  shouldRenderLogin() {
    return this.adApplication && this.didAuthFail() && !this.isAuthAvailable();
  },

  shouldRenderUnknownCategory() {
    const { category } = this.props.params;
    const { allCategories } = this.state;
    return category && allCategories && allCategories.length && allCategories.indexOf(category) === -1;
  },

  shouldRenderError() {
    if (!this.state.error) {
      return false;
    }

    if (this.didAuthFail() && this.isAuthAvailable()) {
      window.location.reload();
      return false;
    }

    return true;
  },

  shouldRenderApp() {
    return this.state.bbox.length;
  },

  render() {
    if (this.shouldRenderLogin()) {
      return this.renderLogin();
    }

    if (this.shouldRenderUnknownCategory()) {
      return this.renderUnknownCategory();
    }

    if (this.shouldRenderError()) {
      return this.renderError();
    }

    if (this.shouldRenderApp()) {
      return this.renderApp();
    }

    return this.renderLoading();
  },

  renderLogin() {
    return (
      <div className="loadingPage">
        <Button bsStyle="primary" onClick={this.adLogin}>Click to log in.</Button>
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

  renderUnknownCategory() {
    const { allCategories } = this.state;
    const { category } = this.props.params;

    return (
      <div className="loadingPage">
        <h1>
          The category <em>{category}</em> does not exist; try <JoinedList joinWord="or" joinToken="," items={allCategories.map(category => <CategoryLink category={category} />)} />
        </h1>
      </div>
    );
  },

  renderLoading() {
    return (
      <div className="loadingPage">
        <h1>
          Loading {this.props.params.category} watcher... ({this.state.initialLoadStepsCompleted} out of {this.state.initialLoadStepsTotal} steps done)
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
            category={this.props.params.category}
            title={this.state.title}
            logo={this.state.logo}
            accessLevels={this.state.accessLevels}
            logoutCallback={this.adApplication ? this.adLogout : null}
            loginCallback={this.adApplication ? this.adLogin : null}
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
