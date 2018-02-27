import React from 'react';
import '../../styles/Header.css';
import { Link } from 'react-router';

class Header extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-trans fortis-navbar">
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

  renderLogo() {
    if (!this.props.logo) {
      return null;
    }

    return (
      <img src={this.props.logo} style={{display: 'inline'}} height="48" alt="" />
    );
  }

  renderNavHeader() {
    return (
      <div className="navbar-header">
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapsible">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <a className="navbar-brand text-danger">
          {this.renderLogo()}
          <span className="brandLabel">{this.props.title}</span>
        </a>
      </div>
    );
  }

  renderLeftNav() {
    return (
      <ul className="nav navbar-nav navbar-left">
        <li>{ this.renderDashboardLink() }</li>
        <li>{ this.renderFactsLink() }</li>
        <li>{ this.renderSettingsLink() }</li>
      </ul>
    );
  }

  renderDashboardLink() {
    const category = this.props.category;

    return (
      <Link to={category ? `/dashboard/${category}` : '/dashboard'} activeClassName="current">Dashboard</Link>
    );
  }

  renderFactsLink() {
    const category = this.props.category;

    return (
      <Link to={category ? `/facts/${category}` : '/facts'} activeClassName="current">Facts</Link>
    );
  }

  renderSettingsLink() {
    const category = this.props.category;

    return (
      <Link to={category ? `/settings/${category}` : '/settings'} activeClassName="current">Settings</Link>
    );
  }

  renderAuth() {
    if (!this.props.userName && this.props.loginCallback) {
      return (
        <a onClick={this.props.loginCallback}>
          Log in
        </a>
      );
    }

    if (this.props.userName && this.props.logoutCallback) {
      return (
        <a onClick={this.props.logoutCallback}>
          Logout {this.props.userName}
        </a>
      );
    }

    return null;
  }

  renderRightNav() {
    return (
      <ul className="nav navbar-nav navbar-right">
        <li>{ this.renderAuth() }</li>
      </ul>
    );
  }
};

export default Header;