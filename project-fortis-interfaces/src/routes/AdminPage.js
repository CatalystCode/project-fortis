import React from 'react';
import createReactClass from 'create-react-class';
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

  render() {
    return (
      <div>
        { this.state.adminStoreState.settings.properties ?
           <div>
              <Admin flux={this.props.flux} {...this.propertyLiterals()} />
            </div>
          : undefined
        }
      </div>
    )
  }
});