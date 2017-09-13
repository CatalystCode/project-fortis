import React from 'react';
import createReactClass from 'create-react-class';

export const Predictions = createReactClass({

    render() {
        return (
            <div id="predictions">
                <iframe src="https://msit.powerbi.com/view?r=eyJrIjoiNjFmNjBhM2UtZjNhNS00YTZjLWEwMjYtNDg0MjM1NDZmYTRlIiwidCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsImMiOjV9" frameBorder="0" allowFullScreen="true"></iframe>
            </div>
        );
    },

});