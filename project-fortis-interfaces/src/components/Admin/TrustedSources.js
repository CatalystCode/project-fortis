import React from 'react';
import { DataGrid } from './DataGrid';
import { getColumns } from './shared';
import { Editors, Formatters } from 'react-data-grid-addons';
const { DropDownEditor } = Editors;
const { DropDownFormatter } = Formatters;

const TRANSLATED_NAME = "translatedname";

class TrustedSources extends React.Component {
  componentDidMount() {
    this.props.flux.actions.ADMIN.notifyDataGridTrustedSourcesLoaded();
  }

  handleSave = rows => {
    rows.forEach(row => row.rowKey = this.getRowKey(row));
    this.props.flux.actions.ADMIN.save_trusted_sources(rows);
  }

  getRowKey = row => {
    return `${row.pipelinekey},${row.externalsourceid}`;
  }

  handleRemove = rows => {
    const sourcesWithAllFieldsSet = this.filterSourcesWithUnsetFields(rows);
    if (this.trustedSourcesToRemoveExist(sourcesWithAllFieldsSet)) {
      this.props.flux.actions.ADMIN.remove_trusted_sources(sourcesWithAllFieldsSet);
    }
  }

  filterSourcesWithUnsetFields = sources => {
    return sources.filter(source => source.pipelinekey.length > 0 || source.externalsourceid.length > 0)
  }

  trustedSourcesToRemoveExist = sources => {
    return sources.length > 0;
  }

  getTrustedSourcesColumns = () => {
    const streams = this.getStreamsForDropdown();
    const columnValues = [
      {key: "pipelinekey", name: "Pipeline Key", editor: <DropDownEditor options={streams}/>, formatter: <DropDownFormatter options={streams} value='Facebook'/>},
      {editable: true, filterable: true, sortable: true, key: "externalsourceid", name: "External Source Id"},
      {editable: true, filterable: true, sortable: true, key: "displayname", name: "Name"},
    ];

    return getColumns(columnValues);
  }

  getStreamsForDropdown = () => {
    let dropdownOptions = [];
    this.props.enabledStreams.forEach((value, key) => {
      dropdownOptions.push({
        id: key,
        value: key,
        text: key,
        title: key
      });
    });
    return dropdownOptions;
  }

  getTranslatableFields = () => {
    const defaultLanguage = this.getDefaultLanguage();
    const alternateLanguage = this.props.settings.properties.supportedLanguages.find(supportedLanguage => supportedLanguage !== defaultLanguage);
    return {
      sourceField: {language: defaultLanguage, key: "name"},
      targetField: {language: alternateLanguage, key: TRANSLATED_NAME}
    };
  }

  getDefaultLanguage = () => {
    return this.props.settings.properties.defaultLanguage;
  }

  render() {
    const trustedSourcesColumns = this.getTrustedSourcesColumns();
    return (
      trustedSourcesColumns.length > 0 ?
        <DataGrid
          rowHeight={40}
          minHeight={500}
          rowKey='rowKey'
          guidAutofillColumn='rowKey'
          handleSave={this.handleSave}
          handleRemove={this.handleRemove}
          translatableFields={null}
          columns={trustedSourcesColumns}
          rows={this.props.trustedSources} />
        : <div />
    );
  }
}

export default TrustedSources;