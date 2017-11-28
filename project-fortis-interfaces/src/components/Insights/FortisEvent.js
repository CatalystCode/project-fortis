import React from 'react';
import { SERVICES } from '../../services/Dashboard';
import { getHumanDateFromNow } from '../../utils/Utils.js';
import constants from '../../actions/constants';
import { extractHostnameIfExists } from './shared';
import '../../styles/Insights/ActivityFeed.css';
import styles from '../../styles/Insights/ActivityFeed';
import Highlighter from 'react-highlight-words';

export default class FortisEvent extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            translated: false
        };
    }

    getSentimentStyle(sentimentScore) {
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

    getSentimentLabelStyle(sentimentScore) {
        if (sentimentScore >= 0 && sentimentScore < 30) {
            return "label label-primary label-news-feed";
        } else if (sentimentScore >= 30 && sentimentScore < 55) {
            return "label label-neutral label-news-feed";
        } else if (sentimentScore >= 55 && sentimentScore < 80) {
            return "label label-warning label-news-feed";
        } else {
            return "label label-danger label-news-feed";
        }
    }

    translateNewsItem(event, sentence, sourcelanguage, targetLanguage, eventId) {
        let self = this;
        event.stopPropagation();

        SERVICES.translateSentence(sentence, sourcelanguage, targetLanguage, (error, response, body) => {
            const { translatedSentence } = body.data.translate;

            if (translatedSentence && !error) {
                self.props.updateFeedWithText(eventId, translatedSentence);
                self.setState({ translated: true });
            } else {
                console.error(`[${error}] occured while translating sentense`);
            }
        });
    }

    render() {
        const{ source, originalSource, link, pageLanguage, featureEdges, 
               edges, postedTime, language, sentence, id, sentiment, 
               enabledStreams } = this.props;
        const dataSourceSchema = enabledStreams.get(source);
        const { translated } = this.state;
        const newsItemTitle = extractHostnameIfExists(originalSource);

        return <div className="infinite-list-item" onClick={() => {
            this.props.handleOpenDialog(this.props.id)
        }
        }>
            <div className="row">
                <div className="col-lg-2" style={styles.labelColumn}>
                    <div className="row" style={styles.labelRow}>
                        <i style={styles.sourceLogo} className={`fa ${dataSourceSchema.icon} fa-4x`}></i>
                    </div>
                    <div className="row" style={styles.labelRow}>
                        {
                            pageLanguage !== language ? <button className={translated ? "btn btn-success btn-sm" : "btn btn-primary btn-sm"}
                                style={styles.translateButton}
                                onClick={ev => { this.translateNewsItem(ev, sentence, language, pageLanguage, id) }} >
                                {translated ? "Translated" : "Translate"}
                                                                                    </button> : ''
                        }
                    </div>
                </div>
                <div className="col-lg-10">
                    <div className="row" style={styles.contentRow}>
                        <h6 style={styles.listItemHeader}>
                            {
                                (link || "") !== "" ? <a style={styles.newsItemAnchor} href={link} onClick={ev => ev.stopPropagation()} target="_blank">{newsItemTitle}</a>
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
                        {edges.map(item => <span key={item} style={Object.assign({}, styles.tagStyle, this.getSentimentStyle(sentiment * 100))} className="edgeTag">{item}</span>)}
                    </div>
                </div>
            </div>
        </div>;
    }
}