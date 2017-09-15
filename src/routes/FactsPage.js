import React from 'react';
import { FactsList } from '../components/Facts/FactsList';
import '../styles/Facts/Facts.css';

export class FactsPage extends React.Component {
  render() {
    return (
      <div className="report">
        <FactsList {...this.props.params} />
      </div>
    );
  }
}