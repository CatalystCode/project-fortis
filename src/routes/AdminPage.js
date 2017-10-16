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
      settings,
      watchlist,
      streams,
      translatableFields,
      enabledStreams
    } = this.getStateFromFlux().adminStoreState;

    const {
      trustedSources
    } = this.getStateFromFlux().dataStoreState;

    return Object.assign({}, { 
      settings,
      watchlist,
      trustedSources,
      streams,
      translatableFields,
      enabledStreams
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