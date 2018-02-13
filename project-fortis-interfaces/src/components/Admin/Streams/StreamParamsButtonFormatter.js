import React from 'react';
import { DataGrid } from '../DataGrid';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import { getColumns } from '../shared';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';

class StreamParamsButtonFormatter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isShowDetailOn: false,
      params: []
    };
  }

  handleSave = () => {
    const stream = this.prepareStreamsForSave();
    this.props.flux.actions.ADMIN.save_stream(stream);
    this.handleHideDetails();
  }

  prepareStreamsForSave = () => {
    let stream = this.getStream();
    if (isString(this.state.params)) {
      stream.params = JSON.parse(this.state.params);
    } else {
      stream.params = this.state.params;
    }
    if (stream.constructor !== Array) stream = [stream];
    return stream;
  }

  handleShowDetails = () => {
    const stream = this.getStream();
    let params = stream.params;
    if (isString(stream.params)) {
      params = JSON.parse(stream.params);
    }

    this.convertParamValuesToString(params);

    this.setState({
      isShowDetailOn: true,
      params: params
    });
  }

  convertParamValuesToString = params => {
    params.forEach(param => {
      if (isBoolean(param.value)) {
        param.value = param.value.toString();
      } else if (isArray(param.value)) {
        param.value = param.value.join(',');
      }
    });
  }

  getStream = () => {
    return this.props.dependentValues;
  }

  handleHideDetails = () => {
    this.setState({
      isShowDetailOn: false
    });
  }

  getStreamParamColumns = () => {
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
          <Modal.Header closeButton />
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