import React from 'react';
import { getSentimentAttributes } from '../Insights/shared';

export default class Sentiment extends React.Component {
  render() {
    const { value, showGraph } = this.props;
    const sentiment = getSentimentAttributes(value);
    const className = `material-icons sentimentIcon ${sentiment.style}`;
    const sentimentIcon = <span className={className}>{sentiment.icon}</span>;
    const displayValue = parseFloat(value * 10).toFixed(0);
    const graphbarClassname = `sentimentGraphBar ${sentiment.style}`;

    if (!showGraph) {
      return <div>{sentimentIcon}</div>;
    }

    return (
      <div>
        <div className="sentimentGraph">
          <div className={graphbarClassname}>
            { displayValue }
          </div>
          {sentimentIcon}
        </div>
      </div>
    );
  }
};
