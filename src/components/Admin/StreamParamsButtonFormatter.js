import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import { DataGrid } from './DataGrid';
import { Glyphicon, Button, Modal } from 'react-bootstrap'; 

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore");

export const StreamParamsButtonFormatter = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],

  getInitialState() {
    return { 
      isShowDetailOn: false,
      params: []
    };
  },

  getStateFromFlux() {
    return this.getFlux().store("AdminStore").getState();
  },

  handleSave() {
    const stream = this.getStream();
    this.getFlux().actions.ADMIN.save_streams([stream]);
    this.handleHideDetails();
  },

  getStream() {
    return this.props.dependentValues;
  },

  handleShowDetails() {
    const stream = this.getStream();
    const params = stream.params;

    this.setState({ 
      isShowDetailOn: true,
      params: params
    });
  },

  handleHideDetails() {
    this.setState({ 
      isShowDetailOn: false 
    });
  },

  render() {
    let state = this.getFlux().store("AdminStore").getState();

    return (
      <div>
        <Button id={this.props.dependentValues.streamId} onClick={this.handleShowDetails} bsStyle="primary" bsSize="xsmall">
          <Glyphicon glyph="edit" /> Edit
        </Button>
        <Modal show={this.state.isShowDetailOn} onHide={this.handleHideDetails}>
          <Modal.Header closeButton>
            <Modal.Title>Parameters for {this.props.dependentValues.pipelineLabel}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <DataGrid 
              rowHeight={40}
              minHeight={500}
              toolbar={null}
              rowKey="key"
              handleSave={this.handleSave}
              columns={this.state.streamParamGridColumns}
              rows={this.state.params}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleHideDetails}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});