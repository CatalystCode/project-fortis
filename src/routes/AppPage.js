import React from 'react';
import createReactClass from 'create-react-class';
import '../styles/Global.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Fluxxor from 'fluxxor';
import Header from '../components/Header';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("DataStore");

export const AppPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount() {
    this.getFlux().actions.DASHBOARD.initializeDashboard(this.props.params.siteKey);
  },

  getStateFromFlux() {
    return this.getFlux().store("DataStore").getState();
  },

  render() {
    if (this.state.bbox.length) {
      return this.renderApp();
    }

    return this.renderLoading();
  },

  renderLoading() {
    return (
      <div className="loadingPage">
        <h1>Loading {this.props.params.siteKey} watcher...</h1>
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
