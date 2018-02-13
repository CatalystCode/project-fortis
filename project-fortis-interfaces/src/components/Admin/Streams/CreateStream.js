import React from 'react';
import Form from 'react-jsonschema-form';
import { Card, CardTitle, CardText } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import StreamConstants from './StreamConstants';
import { guid } from './../../../utils/Utils';
import forOwn from 'lodash/forOwn';
import isBoolean from 'lodash/isBoolean';
import find from 'lodash/find';

class CreateStream extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dropdownValue: StreamConstants.defaultStreamMap.Bing
    };
  }

  save = data => {
    const stream = data.formData.stream;
    const streamType = stream.pipelineKey;

    const addGuidToStreamIfNotExist = () => { if (!stream.streamId || stream.streamId.length === 0) stream.streamId = guid(); }

    const formatParamsForGraphqlSchema = () => {
      const paramEntries = [];
      forOwn(stream.params, (value, key) => {
        paramEntries.push({ key, value: (isBoolean(value) ? value.toString() : value) });
      });
      if (streamType === StreamConstants.defaultStreamMap.Twitter.pipelineKey && !find(paramEntries, {key: 'watchlistFilteringEnabled'})) {
        paramEntries.push({ key: "watchlistFilteringEnabled", value: "false" });
      }
      
      stream.params = paramEntries;
    }

    const setStreamValues = () => {
      stream.pipelineLabel = StreamConstants.defaultStreamMap[streamType].pipelineKey;
      stream.pipelineIcon = StreamConstants.defaultStreamMap[streamType].pipelineIcon;
      stream.streamFactory = StreamConstants.defaultStreamMap[streamType].streamFactory;
      stream.enabled = StreamConstants.defaultStreamMap[streamType].enabled;
    }

    const saveStream = () => this.props.flux.actions.ADMIN.save_stream([stream]);

    addGuidToStreamIfNotExist();
    setStreamValues();
    formatParamsForGraphqlSchema();
    saveStream();

  }

  render() {
    return (
      <Card>
        <CardTitle title="Create Stream"/>
        <Divider />
        <CardText style={{backgroundColor: '#fafafa'}}>
          <Form schema={StreamConstants.schema}
            uiSchema={StreamConstants.uiSchema}
            liveValidate
            showErrorList={false}
            onSubmit={this.save} />
        </CardText>
      </Card>
    );
  }
}

export default CreateStream;