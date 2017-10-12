import React from 'react';
import { Glyphicon, Button } from 'react-bootstrap'; 

const enableButtonStyle = {
  glyph: "ok",
  text: "enabled",
  buttonColor: "success"
};

const disableButtonStyle = {
  glyph: "remove",
  text: "disabled",
  buttonColor: "danger"
};

class StreamStatusButtonFormatter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      buttonStyle: disableButtonStyle
    };

    this.toggleState = this.toggleState.bind(this);
  }

  componentDidMount() {
    const state = this.getStreamState();
    this.initializeButtonStyle(state);
  }

  getStreamState() {
    return this.props.dependentValues.enabled;
  }

  initializeButtonStyle(state) {
    if (this.isStreamEnabled(state)) {
      this.addStyleToButton(enableButtonStyle);
    } else {
      this.addStyleToButton(disableButtonStyle);
    }
  }

  isStreamEnabled(state) {
    return state;
  }

  addStyleToButton(style) {
    this.setState({
      buttonStyle: style
    });
  }

  toggleState() {
    this.toggleButtonStyle();
    this.toggleStreamState();
  }

  toggleButtonStyle() {
    const state = this.getStreamState();
    if (this.isStreamEnabled(state)) {
      this.addStyleToButton(disableButtonStyle);
    } else {
      this.addStyleToButton(enableButtonStyle);
    }
  }

  toggleStreamState() {
    const oldState = this.getStreamState();
    const newState = this.getNewState(oldState);
    const streamWithNewState = this.getStreamWithNewState(newState)
    this.saveStreams(streamWithNewState);
  }

  getNewState(oldState) {
    return !oldState;
  }

  getStreamWithNewState(newState) {
    const stream = this.getStream();
    stream.enabled = newState;
    return stream;
  }

  getStream() {
    return this.props.dependentValues;
  }

  saveStreams(stream) {
    stream = this.prepareStreamsForSave(stream);
    this.props.flux.actions.ADMIN.save_streams(stream);
  }

  prepareStreamsForSave(stream) {
    if (typeof stream.params === 'string') {
      stream.params = JSON.parse(stream.params);
    }
    if (stream.constructor !== Array) stream = [stream];
    return stream;
  }

  render() {
    return (
      <div>
        <Button id={this.props.dependentValues.streamId} bsStyle={this.state.buttonStyle.buttonColor} bsSize="xsmall" onClick={this.toggleState}>
          <Glyphicon glyph={this.state.buttonStyle.glyph} /> {this.state.buttonStyle.text}
        </Button>
      </div>
    );
  }
}

export default StreamStatusButtonFormatter;