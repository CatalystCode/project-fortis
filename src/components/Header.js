import React from 'react';
import '../styles/Header.css';
import { Link } from 'react-router';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class Header extends React.Component {
  changeLanguage(event, index, value){
    this.props.flux.actions.DASHBOARD.changeLanguage(value);
  }

  render() {
    const { title, logo, language }  = this.props;
    const nav = this.renderNav();

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
                                value={language}
                                autoWidth={true}
                                style={{maxWidth:'60px'}}
                                onChange={(event, index, value)=>this.changeLanguage(event, index, value)}>
                                {this.props.supportedLanguages.map(lang => <MenuItem key={lang} value={lang} primaryText={lang} />)}
                    </SelectField>
                  </ul>
                  }
              </div>
          </div>
     </nav>
      );
  }

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

};