import React from 'react';
import IconButton from 'material-ui/IconButton/IconButton';
import NavigationFullscreen from 'material-ui/svg-icons/navigation/fullscreen';
import NavigationFullscreenExit from 'material-ui/svg-icons/navigation/fullscreen-exit';
import { fullWhite } from 'material-ui/styles/colors';

export class HeatmapToggle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false
    };
  }

  onClick = () => {
    this.props.onClick();
    this.setState({
      expanded: !this.state.expanded
    });
  }

  render() {
    const { tooltip, tooltipPosition } = this.props;
    const { expanded } = this.state;

    return (
      <div>
        <IconButton tooltip={tooltip} onClick={this.onClick} tooltipPosition={tooltipPosition}>
          {expanded ? <NavigationFullscreenExit color={fullWhite} /> : <NavigationFullscreen color={fullWhite} />}
        </IconButton>
      </div>
    );
  }
}
