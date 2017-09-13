import React from 'react';
import createReactClass from 'create-react-class';
import { Admin } from '../components/Admin/Admin';
import '../styles/Admin/Admin.css';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminPage = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],
  componentDidMount(){
      this.getFlux().actions.ADMIN.load_settings();
  },

  getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
  },

  componentWillReceiveProps(){
      this.getFlux().actions.ADMIN.load_settings();
  },

  render() {
    return (
      <div>
        { this.state.settings.properties ? 
           <div>
              <Admin flux={this.props.flux} {...this.props.params} />
            </div>
          : undefined
        }
      </div>
    )
  }
});