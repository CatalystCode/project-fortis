import React from 'react';
import '../styles/Global.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Fluxxor from 'fluxxor';
import { Header } from '../components/Header';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("AppSettingsStore");

export const AppPage = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount() {
    this.getFlux().actions.APP.loadSettings(this.props.params.siteKey);
  },

  getStateFromFlux() {
    return this.getFlux().store("AppSettingsStore").getState();
  },

  componentDidUpdate(prevProps, prevState) {
    // handle url site change
    if (prevProps.params.siteKey !== this.props.params.siteKey) {
      this.setState({'settings': {}});
      this.getFlux().actions.APP.loadSettings(this.props.params.siteKey);
    }
  },

  render() {
    return (
      this.state.settings.properties ? 
      <MuiThemeProvider>
      <div id="app">
        <Header id="header" flux={this.props.flux}
            {...this.props.params}
            settings={this.state.settings} />
        <div id="main">
          <div id="content">
            {this.props.children}
          </div>
        </div>
      </div>
     </MuiThemeProvider> : 
    <div className="loadingPage">
      <h1>Loading {this.props.params.siteKey}</h1>
    </div>
  )}
});
