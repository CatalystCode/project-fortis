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
        const { enabledStreams, pageLanguage, settings } = this.props;
        const { body, edges, eventtime, sentiment, title, externalsourceid, pipelinekey, link, places, language } = this.props.properties;
        const { mapSvcToken } = settings;
        const dateText = getHumanDateFromNow(eventtime);
        const dataSourceSchema = enabledStreams.get(pipelinekey);

        const highlightWords = (edges || []).map((word, i) => ({word, className: `highlight-tag highlight-tag-${i}`}))
            .concat(places.map((word, i) => ({word, className: `highlight-place highlight-place-${i}`})));

        return (
            <div id="fact">
                <div className="container-fluid">
                    <div className="row whitespace">
                        <div className="caption">
                            <h6 style={styles.listItemHeader}>{title !== "" ? <span>{title}</span> : undefined}</h6>
                        </div>

                        <div className="col-md-4 viewport">
                            <p className="drop">
                                <MapViewPort coordinates={this.props.coordinates} mapSize={[575, 600]} accessToken={mapSvcToken} />
                            </p>

                            <p className="subheading">Recognized Place(s)</p>
                            <div className="drop">
                                {this.renderPlaces()}
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="article">
                                <p className="text">
                                    <Highlighter
                                        highlightWords={highlightWords}
                                        extraClasses={{img: ['img-responsive']}}
                                        textToHighlight={translatedText || body} />
                                </p>
                            </div>
                        </div>

                        <div className="col-md-2">
                            <div className="details">
                                <p className="drop">
                                    { link !== "" ? <a href={link} target="_blank">Read Original</a> : undefined}
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
                                <p className="drop">
                                    <i className="fa fa-clock-o fa-1"></i>
                                    <span className="date">{dateText}</span>
                                </p>

                                <p className="subheading">Sentiment</p>
                                <div className="drop">
                                    <Sentiment value={sentiment} showGraph={true}></Sentiment>
                                </div>

                                <p className="subheading">Sources</p>
                                <div className="drop">
                                    <i style={styles.sourceLogo} className={`fa ${dataSourceSchema.icon} fa-4x`}></i>
                                    <Chip key={externalsourceid} style={styles.chip}>
                                        <Avatar icon={<FontIcon className="material-icons">share</FontIcon>} />
                                            {extractHostnameIfExists(externalsourceid)}
                                     </Chip>
                                </div>

                                <p className="subheading">Tags</p>
                                <div className="drop">
                                    {this.renderTags()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderPlaces() {
        const { places } = this.props.properties;

        if (!places || !places.length) {
            return null;
        }

        return places.map((place, i) =>
            <Chip key={place} style={styles.chip}>
                <Avatar icon={<FontIcon className="material-icons">place</FontIcon>} />
                <span className={`highlight-place highlight-place-${i}`}>{place}</span>
            </Chip>
        );
    }

    renderTags() {
        const { edges } = this.props.properties;

        if (!edges || !edges.length) {
            return null;
        }

        return edges.map((tag, i) =>
            <Chip key={tag} style={styles.chip}>
                <Avatar icon={<FontIcon className="fa fa-tag" />} />
                <span className={`highlight-tag highlight-tag-${i}`}>{tag}</span>
            </Chip>
        );
    }
};