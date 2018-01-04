import React from 'react';
import { getHumanDateFromNow } from '../../utils/Utils.js';
import { TranslateButton } from './TranslateButton';
import constants from '../../actions/constants';
import { extractHostnameIfExists, stopPropagation, getSentimentAttributes } from './shared';
import '../../styles/Insights/ActivityFeed.css';
import styles from '../../styles/Insights/ActivityFeed';
import Highlighter from 'react-highlight-words';

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
        const { source, featureEdges, sentence, sentiment, enabledStreams, pageLanguage, language } = this.props;
        const dataSourceSchema = enabledStreams.get(source);
        const eventClassName = `infinite-list-item ${getSentimentAttributes(sentiment).style} sentimentListCard`;

        return (
            <div className={eventClassName} onClick={this.handleClick}>
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
                                {this.renderHeader()}
                                {this.renderPostedTime()}
                            </h6>
                        </div>
                        <div className="row" style={styles.contentRow}>
                            <Highlighter
                                searchWords={featureEdges}
                                highlightStyle={styles.highlight}
                                textToHighlight={sentence} />
                        </div>
                        <div className="row" style={styles.contentRow}>
                            {this.renderTags()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderHeader() {
        const { originalSource, link } = this.props;
        const newsItemTitle = extractHostnameIfExists(originalSource);

        if (link) {
            return (
                <a style={styles.newsItemAnchor} href={link} onClick={stopPropagation} target="_blank">
                    {newsItemTitle}
                </a>
            );
        }

        return (
            <span style={styles.newsItemTitle}>
                {newsItemTitle}
            </span>
        );
    }

    renderPostedTime() {
        const { postedTime } = this.props;

        return (
            <span>
                <i className="fa fa-clock-o fa-1"></i>&nbsp;
                {getHumanDateFromNow(postedTime, constants.ACTIVITY_FEED.SERVICE_DATETIME_FORMAT)}
            </span>
        );
    }

    renderTags() {
        const { edges, sentiment } = this.props;

        return edges.map(item =>
            <span key={item} style={styles.tagStyle} className={`edgeTag sentimentBorder ${getSentimentAttributes(sentiment).style}`}>
                {item}
            </span>
        );
    }
}
