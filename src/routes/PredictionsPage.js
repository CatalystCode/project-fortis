import React from 'react';
import createReactClass from 'create-react-class';
import { Predictions } from '../components/Facts/Predictions';
import '../styles/Facts/Predictions.css';

export const PredictionsPage = createReactClass({
  render() {
    return (
      <div className="fullbleed">
        <Predictions flux={this.props.flux} {...this.props.params} />
      </div>
    )
  }
});