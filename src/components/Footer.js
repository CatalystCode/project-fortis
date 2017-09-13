import React, { Component } from 'react';
import logo from '../images/MSFT_logo_png.png';
import '../styles/Footer.css';

class Footer extends Component {
  render() {
    return (
      <footer className="Footer navbar-fixed-bottom">
        <div className="Footer-container">
          <span className="Footer-text"><img src={logo} height="39" width="117" alt="" /></span>
          <span className="Footer-spacer">·</span>
          <a className="Footer-link" href="/">Home</a>
          <span className="Footer-spacer">·</span>
          <a className="Footer-link" href="/privacy">Privacy</a>
          <span className="Footer-spacer">·</span>
        </div>
      </footer>
    );
  }

}

export default Footer;
