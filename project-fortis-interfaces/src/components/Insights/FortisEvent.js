import React from 'react';
import IconButton from 'material-ui/IconButton';
import ActionTranslate from 'material-ui/svg-icons/action/translate';
import { black, green400, grey800 } from 'material-ui/styles/colors';
import { SERVICES } from '../../services/Dashboard';
import { getHumanDateFromNow, doNothing, stopPropagation } from '../../utils/Utils.js';
import constants from '../../actions/constants';
import { extractHostnameIfExists } from './shared';
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
    constructor(props){
        super(props);

        this.state = {
            translated: false
        };
    }

    translateNewsItem = (event) => {
        const { pageLanguage, language, sentence, id } = this.props;
        const self = this;
        event.stopPropagation();

        SERVICES.translateSentence(sentence, language, pageLanguage, (error, response, body) => {
            const { translatedSentence } = body.data.translate;

            if (translatedSentence && !error) {
                self.props.updateFeedWithText(id, translatedSentence);
                self.setState({ translated: true });
            } else {
                console.error(`[${error}] occured while translating sentense`);
            }
        });
    }

    handleClick = () => {
        this.props.handleOpenDialog(this.props.id);
    }

    renderTranslateButton() {
        const { translated } = this.state;
        let { pageLanguage, language } = this.props;

        let buttonAction;
        let buttonTooltip;
        let buttonColor;
        if (pageLanguage === language) {
            buttonAction = stopPropagation;
            buttonColor = grey800;
            buttonTooltip = <span>Unable to translate event text:<br/>the text already is in the page language '{pageLanguage}'</span>;
        } else if (translated) {
            buttonAction = stopPropagation;
            buttonColor = green400;
            buttonTooltip = <span>Event text successfully translated<br/>from '{language}' to '{pageLanguage}'</span>;
        } else {
            buttonAction = this.translateNewsItem;
            buttonColor = black;
            buttonTooltip = <span>Click to translate event text<br/>from '{language}' to '{pageLanguage}'</span>;
        }

        return (
            <IconButton onClick={buttonAction} tooltip={buttonTooltip} tooltipPosition="top-right">
                <ActionTranslate color={buttonColor} />
            </IconButton>
        );
    }

    render() {
        const { source, originalSource, link, featureEdges, edges, postedTime, sentence, sentiment, enabledStreams } = this.props;
        const dataSourceSchema = enabledStreams.get(source);
        const newsItemTitle = extractHostnameIfExists(originalSource);

        return <div className="infinite-list-item" onClick={this.handleClick}>
            <div className="row">
                <div className="col-lg-2" style={styles.labelColumn}>
                    <div className="row" style={styles.labelRow}>
                        <i style={styles.sourceLogo} className={`fa ${dataSourceSchema.icon} fa-4x`}></i>
                    </div>
                    <div className="row" style={styles.labelRow}>
                        {this.renderTranslateButton()}
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