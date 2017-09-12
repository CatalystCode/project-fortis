import React from 'react';
import '../styles/Header.css';
import { Link } from 'react-router';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class Header extends React.Component {
  changeLanguage(event, index, value) {
    this.props.flux.actions.DASHBOARD.changeLanguage(value);
  }

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
    const languages = this.props.supportedLanguages.map(lang =>
      <MenuItem key={lang} value={lang} primaryText={lang} />
    );

    return (
      <SelectField
        underlineStyle={{ borderColor: '#337ab7', borderBottom: 'solid 3px' }}
        labelStyle={{ fontWeight: 600, color: '#2ebd59' }}
        value={this.props.language}
        autoWidth={true}
        style={{maxWidth:'60px'}}
        onChange={(event, index, value) => this.changeLanguage(event, index, value)}>
          {languages}
      </SelectField>
    );
  }
};