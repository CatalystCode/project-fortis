import React from 'react';
import createReactClass from 'create-react-class';
import Snackbar from 'material-ui/Snackbar';
import Admin from '../components/Admin/Admin';
import '../styles/Admin/Admin.css';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  componentDidMount(){
    this.getFlux().actions.ADMIN.load_settings();
  },

  getStateFromFlux() {
    const flux = this.getFlux();
    return {
      dataStoreState: flux.store("DataStore").getState(),
      adminStoreState: flux.store("AdminStore").getState(),
    };
  },

  componentWillReceiveProps() {
    this.getFlux().actions.ADMIN.load_settings();
  },

  propertyLiterals() {
    const {
      users,
      settings,
      watchlist,
      streams,
      translatableFields,
      blacklist
    } = this.getStateFromFlux().adminStoreState;


    const {
      authInfo,
      trustedSources,
      enabledStreams
    } = this.getStateFromFlux().dataStoreState;

    return Object.assign({}, {
      authInfo,
      users,
      settings,
      watchlist,
      trustedSources,
      streams,
      translatableFields,
      enabledStreams,
      blacklist
    });
  },

  renderError() {
    const error = this.getStateFromFlux().adminStoreState.error || '';

    return (
      <Snackbar
        open={!!error}
        message={error}
        autoHideDuration={10000}
        bodyStyle={{height: `${Math.ceil(error.length / 80) * 48}px`}}
      />
    );
  },

  render() {
    return (
      <div>
        { this.state.adminStoreState.settings.properties ?
           <div>
              <Admin flux={this.props.flux} {...this.propertyLiterals()} />
            </div>
          : undefined
        }
        {this.renderError()}
      </div>
    )
  }
});