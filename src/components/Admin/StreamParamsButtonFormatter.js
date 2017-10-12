import React from 'react';
import { DataGrid } from './DataGrid';
import { Glyphicon, Button, Modal } from 'react-bootstrap'; 
import { getColumns } from './shared';

class StreamParamsButtonFormatter extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = { 
      isShowDetailOn: false,
      params: []
    };

    this.getStream = this.getStream.bind(this);
    this.handleShowDetails = this.handleShowDetails.bind(this);
    this.handleHideDetails = this.handleHideDetails.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  handleSave() {
    const stream = this.prepareStreamsForSave();
    this.props.flux.actions.ADMIN.save_streams(stream);
    this.handleHideDetails();
  }

  prepareStreamsForSave() {
    let stream = this.getStream();
    if (typeof this.state.params === 'string') {
      stream.params = JSON.parse(this.state.params);
    } else {
      stream.params = this.state.params;
    }
    if (stream.constructor !== Array) stream = [stream];
    return stream;
  }

  handleShowDetails() {
    const stream = this.getStream();
    
    let params = stream.params;
    if (typeof stream.params === 'string') {
      params = JSON.parse(stream.params);
    }

    this.setState({ 
      isShowDetailOn: true,
      params: params
    });
  }

  getStream() {
    return this.props.dependentValues;
  }

  handleHideDetails() {
    this.setState({ 
      isShowDetailOn: false 
    });
  }

  getStreamParamColumns() {
    const columnValues = [
      {key: "key", name: "key"},
      {editable: true, key: "value", name: "value"}
    ];

    return getColumns(columnValues);
  }

  render() {
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
              columns={this.getStreamParamColumns()}
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
}

export default StreamParamsButtonFormatter;