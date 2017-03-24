import React from 'react';
import { FactDetail } from '../components/Facts/FactDetail';
import '../styles/Facts/Facts.css';

export const FactDetailPage = React.createClass({
  render() {
    return (
        <div className="report">
          <FactDetail {...this.props.params} />
        </div>
    )
  }
});
