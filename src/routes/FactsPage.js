import React from 'react';
import createReactClass from 'create-react-class';
import { FactsList } from '../components/Facts/FactsList';
import '../styles/Facts/Facts.css';

export const FactsPage = createReactClass({
  render() {
    return (
        <div className="report">
          <FactsList {...this.props.params} />
        </div>
    )
  }
});