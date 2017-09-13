import React from 'react';
import createReactClass from 'create-react-class';
import { FactDetail } from '../components/Facts/FactDetail';
import '../styles/Facts/Facts.css';

export const FactDetailPage = createReactClass({
  render() {
    return (
        <div className="report">
          <FactDetail {...this.props.params} />
        </div>
    )
  }
});
