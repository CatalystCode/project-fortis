import React from 'react';
import { Admin } from '../components/Admin/Admin';
import '../styles/Admin/Admin.css';
import Fluxxor from 'fluxxor';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const AdminPage = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  componentDidMount(){
      this.getFlux().actions.ADMIN.load_settings();
  },

  getStateFromFlux() {
        return this.getFlux().store("AdminStore").getState();
  },

  componentWillReceiveProps(){
    if(this.state.settings.name && this.state.settings.name !== this.props.params.siteKey){
      this.getFlux().actions.ADMIN.load_settings(this.props.params.siteKey);
    }
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