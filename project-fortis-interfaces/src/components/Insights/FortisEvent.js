import React from 'react';
import { getHumanDateFromNow } from '../../utils/Utils.js';
import { TranslateButton } from './TranslateButton';
import constants from '../../actions/constants';
import { extractHostnameIfExists, stopPropagation } from './shared';
import '../../styles/Insights/ActivityFeed.css';
import styles from '../../styles/Insights/ActivityFeed';
import Highlighter from 'react-highlight-words';

function getSentimentStyle(sentimentScore) {
    if (sentimentScore >= 0 && sentimentScore < 30) {
        return styles.highlightStyles.positive;
    } else if (sentimentScore >= 30 && sentimentScore < 55) {
        return styles.highlightStyles.neutral;
    } else if (sentimentScore >= 55 && sentimentScore < 80) {
        return styles.highlightStyles.negative;
    } else {
        return styles.highlightStyles.veryNegative;
    }
}

export default class FortisEvent extends React.Component {
    translateNewsItem = (error, translatedSentence) => {
        if (translatedSentence && !error) {
            this.props.updateFeedWithText(this.props.id, translatedSentence);
        } else {
            console.error(`[${error}] occured while translating sentense`);
        }
    }

    handleClick = () => {
        this.props.handleOpenDialog(this.props.id);
    }

    render() {
        const { source, originalSource, link, featureEdges, edges, postedTime, sentence, sentiment, enabledStreams, pageLanguage, language } = this.props;
        const dataSourceSchema = enabledStreams.get(source);
        const newsItemTitle = extractHostnameIfExists(originalSource);

        return <div className="infinite-list-item" onClick={this.handleClick}>
            <div className="row">
                <div className="col-lg-2" style={styles.labelColumn}>
                    <div className="row" style={styles.labelRow}>
                        <i style={styles.sourceLogo} className={`fa ${dataSourceSchema.icon} fa-4x`}></i>
                    </div>
                    <div className="row" style={styles.labelRow}>
                        <TranslateButton
                            fromLanguage={language}
                            toLanguage={pageLanguage}
                            sentence={sentence}
                            onTranslationResults={this.translateNewsItem}
                            tooltipPosition="top-right" />
                    </div>
                </div>
                <div className="col-lg-10">
                    <div className="row" style={styles.contentRow}>
                        <h6 style={styles.listItemHeader}>
                            {
                                (link || "") !== "" ? <a style={styles.newsItemAnchor} href={link} onClick={stopPropagation} target="_blank">{newsItemTitle}</a>
                                    :
                                    <span style={styles.newsItemTitle}>{newsItemTitle}</span>
                            }
                            <i className="fa fa-clock-o fa-1"></i>&nbsp;
                                    {getHumanDateFromNow(postedTime, constants.ACTIVITY_FEED.SERVICE_DATETIME_FORMAT)}
                        </h6>
                    </div>
                    <div className="row" style={styles.contentRow}>
                        <Highlighter
                            searchWords={featureEdges}
                            highlightStyle={styles.highlight}
                            textToHighlight={sentence} />
                    </div>
                    <div className="row" style={styles.contentRow}>
                        {edges.map(item => <span key={item} style={Object.assign({}, styles.tagStyle, getSentimentStyle(sentiment * 100))} className="edgeTag">{item}</span>)}
                    </div>
                </div>
            </div>
        </div>;
    }
}