import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { SERVICES } from '../../services/Dashboard';
import EventDetails from './EventDetails';
import '../../styles/Insights/DialogBox.css';

const dialogWideStyle = {
  width: '80%',
  height: '80%',
  maxWidth: 'none'
};

export default class DialogBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      enabledStreams: props.enabledStreams
    };
  }

  open = (id) => {
    this._loadDetail(id);
  }

  close = () => {
    this.setState({ open: false });
  }

  _loadDetail(id){
    SERVICES.FetchMessageDetail(id, (error, response, body) => {
      if (error || response.statusCode !== 200 || !body.data || !body.data.event ) {
        console.error("Failed to fetch details for id:", id, error);
        return;
      }

      let payload = Object.assign({}, body.data.event, {open: true});
      this.setState({...payload});
    });
  }

  render() {
    const { open } = this.state;
    const { language, settings } = this.props;

    const actions = [
      <FlatButton
        label="Done"
        primary={true}
        onTouchTap={this.close}
      />,
    ];

    return (
      <Dialog
        actions={actions}
        modal={false}
        open={open}
        onRequestClose={this.close}
        contentStyle={dialogWideStyle}
        autoScrollBodyContent
      >
        <div className="content">
          <EventDetails
            {...this.state}
            pageLanguage={language}
            settings={settings}
          />
        </div>
      </Dialog>
    );
  }
};
