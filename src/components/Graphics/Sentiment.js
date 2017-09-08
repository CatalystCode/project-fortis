import React from 'react';

export default class Sentiment extends React.Component {

  getSentimentProperties() {
    const value = this.props.value;
    if (value < 0 || value > 1) {
      console.error("Unexpected sentiment value. Required value to be within range 0-1 but got:", value);
      return null;
    }

    // sentiment_very_dissatisfied
    if (value < 0.3) {
      return { icon: 'sentiment_very_dissatisfied', style: 'negativeSenitment' };
    }

    // sentiment_dissatisfied
    if (value < 0.45) {
      return { icon: 'sentiment_dissatisfied', style: 'neutralNegativeSentiment' };
    }

    // sentiment_neutral
    if (value < 0.55) {
      return { icon: 'sentiment_neutral', style: 'neutralSentiment' };
    }

    // sentiment_satisfied
    if (value < 0.8) {
      return { icon: 'sentiment_satisfied', style: 'neutralPositiveSentiment' };
    }

    // sentiment_very_satisfied
    return { icon: 'sentiment_very_satisfied', style: 'positiveSenitment' };
  }

  render() {
    const sentiment = this.getSentimentProperties();
    const sentimentIcon = <span className={`material-icons sentimentIcon ${sentiment.style}Icon`}>{sentiment.icon}</span>;

    return (
      <div>
        {
          this.props.showGraph ?
          
          <div className="sentimentGraph">
            <div className={`sentimentGraphBar ${sentiment.style}`}>
                {parseFloat(this.props.value * 10).toFixed(2)} / 10
            </div>
            {sentimentIcon}
          </div>
            : undefined
        }
        {sentimentIcon}
      </div>

    );
  }

};

Sentiment.defaultProps = {
  value: 0.5,
  showGraph: true
};

Sentiment.propTypes = {
  value: React.PropTypes.number.isRequired,
  showGraph: React.PropTypes.bool
};