import React from 'react';
import { sanitize } from '../../utils/HtmlSanitizer';

export class Highlighter extends React.Component {
    sanitizeHtml(html) {
        const { extraClasses } = this.props;

        html = sanitize(html, node => {
            const classesToAdd = extraClasses[node.nodeName.toLowerCase()] || [];
            classesToAdd.forEach(className => {
                node.classList += className;
            });
            return node;
        });

        return html;
    }

    highlightHtml(html) {
        const { searchWords, highlightStyle } = this.props;
        const highlightWords = new Set(searchWords);

        highlightWords.forEach(highlightWord => {
            html = html.replace(new RegExp(highlightWord, 'ig'), `<mark style="${highlightStyle}">${highlightWord}</mark>`);
        });

        return html;
    }

    renderHtml() {
        let html = this.props.textToHighlight;
        html = this.sanitizeHtml(html);
        html = this.highlightHtml(html);
        return html;
    }

    render() {
        return (
            <span dangerouslySetInnerHTML={{__html: this.renderHtml()}} />
        );
    }
}
