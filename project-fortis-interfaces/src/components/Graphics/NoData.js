import React from 'react';
import IconButton from 'material-ui/IconButton';
import ActionHighlightOff from 'material-ui/svg-icons/action/highlight-off';
import { fullWhite } from 'material-ui/styles/colors';

export default class NoData extends React.Component {
    render() {
        return (
            <IconButton tooltip="No data. Try changing the filters to view more items in this widget.">
                <ActionHighlightOff color={fullWhite} />
            </IconButton>
        );
    }
};
