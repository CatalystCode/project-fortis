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
    return this.getFlux().store("AdminStore").getState();
  },

  componentWillReceiveProps() {
    this.getFlux().actions.ADMIN.load_settings();
  },
  
  propertyLiterals() {
    const { 
      settings,
      watchlist,
      translatableFields
    } = this.getStateFromFlux();

    return Object.assign({}, { 
      settings,
      watchlist,
      translatableFields
    });
  },

  render() {
    return (
      <div>
        { this.state.settings.properties ? 
           <div>
              <Admin flux={this.props.flux} {...this.propertyLiterals()} />
            </div>
          : undefined
        }
      </div>
    )
  }
});