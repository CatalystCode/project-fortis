import React from 'react';
import { getHumanDateFromNow } from '../../utils/Utils.js';
import Sentiment from '../Graphics/Sentiment';
import Avatar from 'material-ui/Avatar';
import FontIcon from 'material-ui/FontIcon';
import MapViewPort from './MapViewPort';
import { TranslateButton } from '../Insights/TranslateButton';
import { Highlighter } from './Highlighter';
import { extractHostnameIfExists } from '../Insights/shared';
import Chip from 'material-ui/Chip';
import { blue300, indigo900 } from 'material-ui/styles/colors';

const styles = {
    listItemHeader: {
        font: '.777777778em Arial,Helvetica,sans-serif',
        marginBottom: '3px',
        fontWeight: 500,
        marginTop: '2px',
        textAlign: 'left',
        color: '#f44d3c',
        fontSize: '22px'
    },
    chip: {
        margin: 4,
    },
    sourceLogo: {
        color: "#337ab7"
    },
    title: {
        font: '.777777778em Arial,Helvetica,sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        color: 'rgb(51, 122, 183)'
    }
};

export default class EventDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            translatedText: '',
        };
    }

    translateEvent = (error, translatedText) => {
        if (translatedText && !error) {
            this.setState({ translatedText });
        } else {
            console.error(`[${error}] occured while translating sentense`);
        }
    }

    render() {
        const { translatedText } = this.state;
        const { enabledStreams, pageLanguage } = this.props;
        const { body, edges, eventtime, sentiment, title, externalsourceid, pipelinekey, link, places, language } = this.props.properties;
        const dateText = getHumanDateFromNow(eventtime);
        const dataSourceSchema = enabledStreams.get(pipelinekey);
        const tags = edges || [];

        return (
            <div id="fact">
                <div className="container-fluid">
                    <div className="row whitespace">
                        <div className="caption">
                            <h6 style={styles.listItemHeader}>
                                {
                                    title !== "" ? <span>{title}</span> : undefined
                                }
                            </h6>
                        </div>
                        <div className="col-md-4 viewport">
                            <p className="drop">
                                <MapViewPort coordinates={this.props.coordinates} mapSize={[575, 600]} />
                            </p>
                            <p className="subheading">Recognized Place(s)</p>
                            <div className="drop">
                                {places.length && places.map(place => <Chip key={place} backgroundColor={blue300} style={styles.chip}>
                                    <Avatar icon={<FontIcon className="material-icons">place</FontIcon>} />
                                    {place}
                                </Chip>)}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="article">
                                <p className="text">
                                    <Highlighter searchWords={tags.concat(places)}
                                        highlightStyle="background-color: #ffd54f; font-weight: 600;"
                                        extraClasses={{img: ['img-responsive']}}
                                        textToHighlight={translatedText || body} />
                                </p>
                            </div>
                        </div>
                        <div className="col-md-2">
                            <div className="details">
                                <p className="drop">
                                    {
                                        link !== "" ? <a href={link} target="_blank">Read Original</a>
                                            : undefined
                                    }
                                </p>
                                <p className="drop">
                                    <TranslateButton
                                        fromLanguage={language}
                                        toLanguage={pageLanguage}
                                        sentence={body}
                                        onTranslationResults={this.translateEvent}
                                        tooltipPosition="top-left" />
                                </p>
                                <p className="subheading">Date created</p>
                                <p className="drop"><i className="fa fa-clock-o fa-1"></i><span className="date">{dateText}</span></p>

                                <p className="subheading">Sentiment</p>
                                <div className="drop">
                                    <Sentiment value={sentiment} showGraph={true}></Sentiment>
                                </div>

                                <p className="subheading">Sources</p>
                                <div className="drop">
                                    <i style={styles.sourceLogo} className={`fa ${dataSourceSchema.icon} fa-4x`}></i>
                                    {
                                        <Chip key={externalsourceid} style={styles.chip}>
                                            <Avatar icon={<FontIcon className="material-icons">share</FontIcon>} />
                                            {extractHostnameIfExists(externalsourceid)}
                                        </Chip>
                                    }
                                </div>
                                <p className="subheading">Tags</p>
                                <div className="drop">
                                    {tags && tags.map(tag => <Chip key={tag} backgroundColor={blue300} style={styles.chip}>
                                        <Avatar size={32} color={blue300} backgroundColor={indigo900}>
                                            {tag.substring(0, 2)}
                                        </Avatar>
                                        {tag}
                                    </Chip>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

};