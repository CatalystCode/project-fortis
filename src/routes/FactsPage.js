import React from 'react';
import { FactsList } from '../components/Facts/FactsList';
import '../styles/Facts/Facts.css';

export const FactsPage = React.createClass({
  render() {
    return (
        <div className="report">
          <FactsList {...this.props.params} />
        </div>
    )
  }
});