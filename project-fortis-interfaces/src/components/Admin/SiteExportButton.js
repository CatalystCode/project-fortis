import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, Glyphicon } from 'react-bootstrap';
import Snackbar from 'material-ui/Snackbar';
import moment from 'moment';

import { SERVICES as AdminServices } from '../../services/Admin';
import { ResponseHandler } from '../../actions/shared';
import { doNothing } from '../../utils/Utils';

export default class SiteExportButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      notification: '',
      exportUrl: ''
    };
  }

  exportSite = () => {
    if (this.state.loading) {
      return;
    }

    AdminServices.exportSite((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (error) {
        const notification = 'Something went wrong while exporting the site';
        this.setState({ loading: false, notification });
        console.error(error);
      } else {
        const { url, expires } = graphqlResponse.exportSite;
        const notification = `Site export link copied to clipboard, expires ${moment(expires).fromNow()}`;
        this.setState({ exportUrl: url, loading: false, notification });
      }
    }));

    this.setState({ loading: true, exportUrl: '', notification: '' });
  }

  onRequestClose = () => {
    this.setState({ notification: '' });
  }

  render() {
    const { loading, notification, exportUrl } = this.state;
    const { size } = this.props;

    return (
      <span>
        <CopyToClipboard text={exportUrl}>
          <Button disabled={loading} onClick={loading ? doNothing : this.exportSite} bsSize={size}>
            <Glyphicon glyph="export" /> {loading ? "Settings are being exported..." : "Export settings"}
          </Button>
        </CopyToClipboard>
        <Snackbar
          open={!!notification}
          message={notification}
          autoHideDuration={5000}
          onRequestClose={this.onRequestClose}
        />
      </span>
    );
  }
}
