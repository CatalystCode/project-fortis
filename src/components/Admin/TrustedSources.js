import React from 'react';
import { DataGrid } from './DataGrid';
import { getColumns } from './shared';
const { Editors, Formatters } = require('react-data-grid-addons');
const { DropDownEditor } = Editors;
const { DropDownFormatter } = Formatters;

const TRANSLATED_NAME = "translatedname";

class TrustedSources extends React.Component {
  constructor(props) {
    super(props);

    this.getTrustedSourcesColumns = this.getTrustedSourcesColumns.bind(this);
    this.getTranslatableFields = this.getTranslatableFields.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  componentDidMount() {
    this.props.flux.actions.ADMIN.notifyDataGridTrustedSourcesLoaded();
  }

  handleSave(rows) {
    rows.map(row => row.rowKey = this.getRowKey(row));
    this.props.flux.actions.ADMIN.save_trusted_sources(rows);
  }

  getRowKey(row) {
    return row.pipelinekey + ',' + row.externalsourceid + ',' + row.sourcetype + ',' + row.rank;
  }

  handleRemove(rows) {    
    const sourcesWithAllFieldsSet = this.filterSourcesWithUnsetFields(rows);
    if (this.trustedSourcesToRemoveExist(sourcesWithAllFieldsSet)) {
      this.props.flux.actions.ADMIN.remove_trusted_sources(sourcesWithAllFieldsSet);
    }
  }

  filterSourcesWithUnsetFields(sources) {
    return sources.filter(source => source.pipelinekey.length > 0 || source.externalsourceid.length > 0 || source.sourcetype.length > 0 || source.rank.length > 0)
  }

  trustedSourcesToRemoveExist(sources) {
    const shouldRemove = sources.length > 0;
    return shouldRemove;
  }

  getTrustedSourcesColumns() {
    const pipelineKeys = [
      { id: 'Twitter', value: 'Twitter', text: 'Twitter', title: 'Twitter' },
      { id: 'Facebook', value: 'Facebook', text: 'Facebook', title: 'Facebook' }
    ];

    const columnValues = [
      {key: "pipelinekey", name: "Pipeline Key", editor: <DropDownEditor options={pipelineKeys}/>, formatter: <DropDownFormatter options={pipelineKeys} value='Facebook'/>},
      {editable: true, filterable: true, sortable: true, key: "externalsourceid", name: "External Source Id"},
      {editable: true, filterable: true, sortable: true, key: "reportingcategory", name: "Category"},
      {editable: true, filterable: true, sortable: true, key: "displayname", name: "Name"},
      {editable: true, filterable: true, sortable: true, key: "sourcetype", name: "Source Type"},
      {editable: true, filterable: true, sortable: true, key: "rank", name: "Rank"},
    ];

    return getColumns(columnValues);
  }

  getTranslatableFields() {
    const defaultLanguage = this.getDefaultLanguage();
    const alternateLanguage = this.props.settings.properties.supportedLanguages.find(supportedLanguage => supportedLanguage !== defaultLanguage);
    return { 
      sourceField: {language: defaultLanguage, key: "name"}, 
      targetField: {language: alternateLanguage, key: TRANSLATED_NAME}
    };
  }

  getDefaultLanguage() {
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