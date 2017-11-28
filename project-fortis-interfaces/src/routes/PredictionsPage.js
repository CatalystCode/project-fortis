import React from 'react';
import { Predictions } from '../components/Facts/Predictions';
import '../styles/Facts/Predictions.css';

export class PredictionsPage extends React.Component {
  render() {
    return (
      <div className="fullbleed">
        <Predictions flux={this.props.flux} {...this.props.params} />
      </div>
    );
  }
}