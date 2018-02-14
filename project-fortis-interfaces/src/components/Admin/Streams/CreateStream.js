import React from 'react';
import Form from 'react-jsonschema-form';
import { Card, CardTitle, CardText } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import StreamConstants from './StreamConstants';
import { guid } from './../../../utils/Utils';
import forOwn from 'lodash/forOwn';
import isBoolean from 'lodash/isBoolean';
import find from 'lodash/find';
import uniqBy from 'lodash/uniqBy';

class CreateStream extends React.Component {
  save = data => {
    const stream = data.formData.stream;

    const streamType = stream.pipelineKey;

    const addGuidToStreamIfNotExist = () => { if (!stream.streamId || stream.streamId.length === 0) stream.streamId = guid(); }

    const formatParamsForGraphqlSchema = () => {
      let paramEntries = [];

      formatRadioLocale();
      formatAsArrayOfKeyValueObjects(paramEntries);
      addMissingParameterFromCheckbox(paramEntries);
      
      stream.params = paramEntries;

      function formatAsArrayOfKeyValueObjects(paramEntries) {
        forOwn(stream.params, (value, key) => {
          paramEntries.push({ key, value: (isBoolean(value) ? value.toString() : value) });
        });
      }

      function addMissingParameterFromCheckbox(paramEntries) {
        if (streamType === StreamConstants.defaultStreamMap.Twitter.pipelineKey && !find(paramEntries, {key: 'watchlistFilteringEnabled'})) {
          paramEntries.push({ key: "watchlistFilteringEnabled", value: "false" });
        }
      }

      function formatRadioLocale() {
        if (stream.params.locale) {
          const language = stream.params.locale.language;
          const languageCode = StreamConstants.supportedLanguagesMap[language].languageCode;
          const region = StreamConstants.supportedLanguagesMap[language].regions[stream.params.locale.region];
          stream.params.locale = `${languageCode}-${region}`;
        }
      }
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

  filterErrorsAndMakeUniqueByProperty = errors => {
    errors = errors.filter(error => error.message !== 'should match exactly one schema in oneOf' && error.message !== 'should be equal to one of the allowed values');
    return uniqBy(errors, 'property');
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
            transformErrors={this.filterErrorsAndMakeUniqueByProperty}
            showErrorList={false}
            onSubmit={this.save} />
        </CardText>
      </Card>
    );
  }
}

export default CreateStream;