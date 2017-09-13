import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import { DataGrid } from './DataGrid';
import { Glyphicon, Button } from 'react-bootstrap'; 

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

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

export const StreamStatusButtonFormatter = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getInitialState() {
    return disableButtonStyle;
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  componentDidMount() {
    const state = this.getStreamState();
    this.initializeButtonStyle(state);
  },

  getStreamState() {
    return this.props.dependentValues.enabled;
  },

  initializeButtonStyle(state) {
    if (this.isStreamEnabled(state)) {
      this.addStyleToButton(enableButtonStyle);
    } else {
      this.addStyleToButton(disableButtonStyle);
    }
  },

  isStreamEnabled(state) {
    return state;
  },

  addStyleToButton(style) {
    this.setState((prevState, props) => {
      return style;
    });
  },

  toggleState() {
    this.toggleButtonStyle();
    this.toggleStreamState();
  },

  toggleButtonStyle() {
    const state = this.getStreamState();
    if (this.isStreamEnabled(state)) {
      this.addStyleToButton(disableButtonStyle);
    } else {
      this.addStyleToButton(enableButtonStyle);
    }
  },

  toggleStreamState() {
    const oldState = this.getStreamState();
    const newState = this.getNewState(oldState);
    const streamWithNewState = this.getStreamWithNewState(newState)
    this.saveStream(streamWithNewState);
  },

  getNewState(oldState) {
    return !oldState;
  },

  getStreamWithNewState(newState) {
    const stream = this.getStream();
    stream.enabled = newState;
    return stream;
  },

  getStream() {
    return this.props.dependentValues;
  },

  saveStream(stream) {
    this.getFlux().actions.ADMIN.save_streams([stream]);
  },

  render() {
    return (
      <div>
        <Button id={this.props.dependentValues.streamId} bsStyle={this.state.buttonColor} bsSize="xsmall" onClick={this.toggleState}>
          <Glyphicon glyph={this.state.glyph} /> {this.state.text}
        </Button>
      </div>
    );
  }
});