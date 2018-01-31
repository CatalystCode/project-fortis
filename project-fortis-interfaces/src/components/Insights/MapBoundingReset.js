import React from 'react';
import IconButton from 'material-ui/IconButton/IconButton';
import Map from 'material-ui/svg-icons/maps/map';
import { fullWhite } from 'material-ui/styles/colors';

export default class MapBoundingReset extends React.Component {
  render() {
    const { tooltipPosition } = this.props;
    const tooltip = `Click to reset map boundaries.`;

    return (
      <div>
        <IconButton tooltip={tooltip} onClick={this.props.onClick} tooltipPosition={tooltipPosition}>
          <Map color={fullWhite} />
        </IconButton>
      </div>
    );
  }
}
