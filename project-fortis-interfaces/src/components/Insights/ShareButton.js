import React from 'react';
import IconButton from 'material-ui/IconButton/IconButton';
import Snackbar from 'material-ui/Snackbar';
import SocialShare from 'material-ui/svg-icons/social/share';
import { fullWhite } from 'material-ui/styles/colors';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export default class ShareButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      notification: '',
      copied: false
    };
  }

  onCopy = () => {
    this.setState({ copied: true, notification: this.props.notification });
  }

  onRequestClose = () => {
      this.setState({ notification: '' });
  }

  render() {
    const { tooltipPosition, tooltip, link } = this.props;
    const { notification } = this.state;

    return (
      <div>
        <CopyToClipboard text={link} onCopy={this.onCopy}>
            <IconButton tooltip={tooltip} tooltipPosition={tooltipPosition}>
              <SocialShare color={fullWhite} />
            </IconButton>
        </CopyToClipboard>
        <Snackbar
          open={!!notification}
          message={notification}
          autoHideDuration={4000}
          onRequestClose={this.onRequestClose}
        />
      </div>
    );
  }
};
