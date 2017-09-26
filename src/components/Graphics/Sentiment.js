import React from 'react';
import { getSentimentAttributes } from '../Insights/shared';

export default class Sentiment extends React.Component {

  render() {
    const { value } = this.props;
    const sentiment = getSentimentAttributes(value);
    const className = `material-icons sentimentIcon ${sentiment.style}Icon`;
    const sentimentIcon = <span className={className}>{sentiment.icon}</span>;
    const displayValue = parseFloat(this.props.value * 10).toFixed(0);
    const graphbarClassname = `sentimentGraphBar ${sentiment.style}`;

    return (
      <div>
        {
          this.props.showGraph ?
            <div className="sentimentGraph">
              <div className={graphbarClassname}>
                  { displayValue }
              </div>
              {sentimentIcon}
            </div>
            : {sentimentIcon}
        }
      </div>

    );
  }

};