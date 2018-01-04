import React from 'react';
import IconButton from 'material-ui/IconButton';
import ActionTranslate from 'material-ui/svg-icons/action/translate';
import { black, green400, grey800 } from 'material-ui/styles/colors';
import { stopPropagation } from '../../utils/Utils.js';
import { SERVICES } from '../../services/Dashboard';

export class TranslateButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            translatedSentence: '',
        };
    }

    translateSentence = (event) => {
        event.stopPropagation();

        const { toLanguage, fromLanguage, sentence } = this.props;
        const { translatedSentence } = this.state;

        if (translatedSentence) {
            this.props.onTranslationResults(null, {event, translatedSentence});
            return;
        }

        SERVICES.translateSentence(sentence, fromLanguage, toLanguage, (error, response, body) => {
            const translationResult = body && body.data && body.data.translate && body.data.translate.translatedSentence;

            if (translationResult && !error) {
                this.props.onTranslationResults(null, translationResult);
                this.setState({ translatedSentence: translationResult });
            } else {
                this.props.onTranslationResults(error, null);
            }
        });
    }

    render() {
        const { translatedSentence } = this.state;
        const { toLanguage, fromLanguage, tooltipPosition } = this.props;

        let buttonAction;
        let buttonTooltip;
        let buttonColor;
        if (toLanguage === fromLanguage) {
            buttonAction = stopPropagation;
            buttonColor = grey800;
            buttonTooltip = <span>Unable to translate text:<br/>the text already is in the language '{toLanguage}'</span>;
        } else if (translatedSentence) {
            buttonAction = stopPropagation;
            buttonColor = green400;
            buttonTooltip = <span>Text successfully translated<br/>from '{fromLanguage}' to '{toLanguage}'</span>;
        } else {
            buttonAction = this.translateSentence;
            buttonColor = black;
            buttonTooltip = <span>Click to translate text<br/>from '{fromLanguage}' to '{toLanguage}'</span>;
        }

        return (
            <IconButton onClick={buttonAction} tooltip={buttonTooltip} tooltipPosition={tooltipPosition}>
                <ActionTranslate color={buttonColor} />
            </IconButton>
        );
    }
}
