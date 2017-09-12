import React from 'react';
import '../styles/Header.css';
import { Link } from 'react-router';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import LanguagePicker from './LanguagePicker';

class Header extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-trans" role="navigation">
        <div>
          { this.renderNavHeader() }
          <div className="navbar-collapse collapse" id="navbar-collapsible">
            { this.renderLeftNav() }
            { this.renderRightNav() }
          </div>
        </div>
      </nav>
    );
  }

  renderNavHeader() {
    const { title, logo, language } = this.props;

    return (
      <div className="navbar-header">
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapsible">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <a className="navbar-brand text-danger" href="#">
          { logo && <img role="presentation" src={logo.startsWith("http:") ? logo : `${process.env.PUBLIC_URL}/images/${logo}`} style={{display: 'inline'}} height="48" /> }
          <span className="brandLabel">{title}</span>
        </a>
      </div>
    );
  }

  renderLeftNav() {
    return (
      <ul className="nav navbar-nav navbar-left">
        <li>{ this.renderDashboardLink() }</li>
        <li>{ this.renderFactsLink() }</li>
        { this.props.siteKey === "dengue" && <li>{ this.renderPredictionsLink() }</li> }
      </ul>
    );
  }

  renderDashboardLink() {
    return (
      <Link to={`/site/${this.props.siteKey}/`} activeClassName="current">Dashboard</Link>
    );
  }

  renderFactsLink() {
    return (
      <Link to={`/site/${this.props.siteKey}/facts/`} activeClassName="current">Facts</Link>
    );
  }

  renderPredictionsLink() {
    return (
      <Link to={`/site/${this.props.siteKey}/predictions/`} activeClassName="current">Predictions</Link>
    );
  }

  renderRightNav() {
    return (
      <ul className="nav navbar-nav navbar-right">
        { this.props.settings && <li>{ this.renderLanguagePicker() }</li> }
      </ul>
    );
  }

  renderLanguagePicker() {
    return (
      <LanguagePicker
        supportedLanguages={this.props.supportedLanguages}
        language={this.props.language}
        flux={this.props.flux}
      />
    );
  }
};

export default Header;