import React from 'react';
import { FactDetail } from '../components/Facts/FactDetail';
import '../styles/Facts/Facts.css';

export class FactDetailPage extends React.Component {
  render() {
    return (
      <div className="report">
        <FactDetail {...this.props.params} />
      </div>
    );
  }
}