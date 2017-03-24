import React from 'react';
import '../styles/Header.css';
import { Link } from 'react-router';
import Fluxxor from 'fluxxor';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const FluxMixin = Fluxxor.FluxMixin(React),
      StoreWatchMixin = Fluxxor.StoreWatchMixin("AppSettingsStore");

export const Header = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin],
  
  getStateFromFlux() {
    return this.getFlux().store("AppSettingsStore").getState();
  },

  componentWillReceiveProps(nextProps) {
       this.setState(this.getStateFromFlux());
  },

  changeLanguage(event, index, value){
      this.getFlux().actions.DASHBOARD.changeLanguage(value);
  },

  render() {
    const title = this.props.settings && this.props.settings.properties ? this.props.settings.properties.title : "";
    const nav = this.renderNav();
    const logo = this.props.settings && this.props.settings.properties ? this.props.settings.properties.logo : false;
    return (
      <nav className="navbar navbar-trans" role="navigation">
          <div>
              <div className="navbar-header">
                  <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapsible">
                      <span className="sr-only">Toggle navigation</span>
                      <span className="icon-bar"></span>
                      <span className="icon-bar"></span>
                      <span className="icon-bar"></span>
                  </button>
                  <a className="navbar-brand text-danger" href="#">
                     {
                         logo ? <img role="presentation" src={logo.startsWith("http:") ? logo : `${process.env.PUBLIC_URL}/images/${logo}`} style={{display: 'inline'}} height="48" /> 
                            : undefined 
                     }                     
                     <span className="brandLabel">{title}</span>
                  </a>
              </div>
              <div className="navbar-collapse collapse" id="navbar-collapsible">
                  {nav}
                { this.props.settings && 
                 <ul className="nav navbar-nav navbar-right">
                     <SelectField underlineStyle={{ borderColor: '#337ab7', borderBottom: 'solid 3px' }}
                                labelStyle={{ fontWeight: 600, color: '#2ebd59' }}
                                value={this.state.language}
                                autoWidth={true}
                                style={{maxWidth:'60px'}}
                                onChange={this.changeLanguage}>
                                {this.props.settings.properties.supportedLanguages.map(function (lang) {
                                        return <MenuItem key={lang} value={lang} primaryText={lang} />                                
                                })}
                    </SelectField>
                  </ul>
                  }
              </div>
          </div>
     </nav>
      );
  },

  renderNav() {
      let siteKey = this.props.siteKey;
      return (
          <ul className="nav navbar-nav navbar-left">
              <li><Link to={`/site/${siteKey}/`} activeClassName="current">Dashboard</Link></li>
              <li><Link to={`/site/${siteKey}/facts/`} activeClassName="current">Facts</Link></li>
              {this.props.siteKey==="dengue" && <li><Link to={`/site/${siteKey}/predictions/`} activeClassName="current">Predictions</Link></li>}
          </ul>
      );
  }

});