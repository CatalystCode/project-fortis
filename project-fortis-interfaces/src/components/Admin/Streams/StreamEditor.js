import React from 'react';
import { DataGrid } from '../DataGrid';
import { getColumns } from '../shared';
import CreateStream from './CreateStream';
import StreamParamsButtonFormatter from './StreamParamsButtonFormatter';
import StreamStatusButtonFormatter from './StreamStatusButtonFormatter';
import { Card, CardTitle, CardText } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import isString from 'lodash/isString';

class StreamEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      streamToBeEdited: {}
    }
  }

  componentDidMount() {
    this.props.flux.actions.ADMIN.load_streams();
  }

  getStreamColumns() {
    const columnValues = [
      {key: "pipelineKey", name: "Type"},
      {width: 115, key: "status", name: "Status", formatter: <StreamStatusButtonFormatter flux={this.props.flux}/>, getRowMetaData: (row) => row},
      {width: 70, key: "params", name: "Edit", formatter: <StreamParamsButtonFormatter flux={this.props.flux}/>, getRowMetaData: (row) => row}
    ];

    return getColumns(columnValues);
  }

  handleSave = (streams) => {
    this.prepareStreamsForSave(streams);
    this.props.flux.actions.ADMIN.save_stream(streams);
  }

  handleRemove = (streams) => {
    this.prepareStreamsForSave(streams);
    this.props.flux.actions.ADMIN.remove_streams(streams);
  }

  prepareStreamsForSave = streams => {
    streams.forEach(stream => {
      if (isString(stream.params)) stream.params = JSON.parse(stream.params);
    });
  }

  render() {
    return (
      this.getStreamColumns().length <= 0 ?
        <div /> :
        <div className="row">
          <div className="col-lg-6">
          <Card>
            <CardTitle title="Configured Streams"/>
            <Divider />
            <CardText>
              <DataGrid
                rowHeight={40}
                minHeight={500}
                toolbar={null}
                rowKey="streamId"
                guidAutofillColumn="streamId"
                columns={this.getStreamColumns()}
                rows={this.props.streams}
                handleSave={this.handleSave}
                handleRemove={this.handleRemove}
              />
            </CardText>
          </Card>
          </div>
          <div className="col-lg-6">
            <div className="p-2">
              <CreateStream flux={this.props.flux} streamToBeEdited={this.state.streamToBeEdited}/>
            </div>
          </div>
        </div>
    );
  }
}

export default StreamEditor;