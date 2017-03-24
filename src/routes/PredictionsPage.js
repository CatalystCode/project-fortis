import React from 'react';
import { Predictions } from '../components/Facts/Predictions';
import '../styles/Facts/Predictions.css';

export const PredictionsPage = React.createClass({
  render() {
    return (
      <div className="fullbleed">
        <Predictions flux={this.props.flux} {...this.props.params} />
      </div>
    )
  }
});