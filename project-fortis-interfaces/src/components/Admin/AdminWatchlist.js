import { DataGrid } from './DataGrid';
import React from 'react';
import { getColumns } from './shared';

const TRANSLATED_NAME = "translatedname";

class AdminWatchlist extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: {}
    };

    this.getTopicColumns = this.getTopicColumns.bind(this);
    this.getTranslatableFields = this.getTranslatableFields.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  componentDidMount() {
    const translationLanguage = this.getTranslationLanguage();
    this.props.flux.actions.ADMIN.load_topics(translationLanguage);
  }

  getTranslationLanguage() {
    const supportedLanguages = this.props.settings.properties.supportedLanguages;
    const defaultLanguage = this.props.settings.properties.defaultLanguage;

    let translationLanguages = [];
    supportedLanguages.forEach(supportedLanguage => {
      if (supportedLanguage !== defaultLanguage) translationLanguages.push(supportedLanguage);
    });

    if (translationLanguages.length > 0) {
      return translationLanguages[0];
    }

    return defaultLanguage;
  }

  getTopicColumns() {
    const supportedLanguages = this.props.settings.properties.supportedLanguages;
    const defaultLanguage = this.props.settings.properties.defaultLanguage;

    const columnValues = [
      {editable: true, filterable: true, sortable: true, key: "category", name: "Category"},
      {editable: true, filterable: true, sortable: true, key: "name", name: "name"}
    ];

    supportedLanguages.forEach(supportedLanguage => {
      if (supportedLanguage !== defaultLanguage) {
        columnValues.push({
          editable: true,
          filterable: true,
          sortable: true,
          key: TRANSLATED_NAME,
          name: "name_" + supportedLanguage
        })
      }
    });

    return getColumns(columnValues);
  }

  handleSave(topics) {
    const formattedTopics = this.formatTopicsForSave(topics);
    this.props.flux.actions.ADMIN.save_topics(formattedTopics);
  }

  formatTopicsForSave(topics) {
    topics.map(topic => {
      topic.namelang = this.getDefaultLanguage()
      topic.translatednamelang = this.getTranslationLanguage()
      topic.translations = [{
        key: this.getTranslationLanguage(),
        value: topic.translatedname
      }]
      return topic;
    });
    return topics;
  }

  getDefaultLanguage() {
    return this.props.settings.properties.defaultLanguage;
  }

  handleRemove(topics) {
    const topicsWithAllFieldsSet = this.filterTopicsWithUnsetFields(topics);
    if (this.topicsToRemoveExist(topicsWithAllFieldsSet)) {
      this.props.flux.actions.ADMIN.remove_topics(topicsWithAllFieldsSet);
    } else {
      const translationLanguage = this.getTranslationLanguage();
      this.props.flux.actions.ADMIN.load_topics(translationLanguage);
    }
  }

  topicsToRemoveExist(topics) {
    const shouldRemove = topics.length > 0;
    return shouldRemove;
  }

  filterTopicsWithUnsetFields(topics) {
    return topics.filter(topic => topic.category.length > 0 || topic.name.length > 0 || topic.translatedname.length > 0)
  }

  getTranslatableFields() {
    const defaultLanguage = this.getDefaultLanguage();
    const alternateLanguage = this.props.settings.properties.supportedLanguages.find(supportedLanguage => supportedLanguage !== defaultLanguage);
    return {
      sourceField: {language: defaultLanguage, key: "name"},
      targetField: {language: alternateLanguage, key: TRANSLATED_NAME}
    };
  }

  render() {
    return (
      this.getTopicColumns().length > 0 ?
        <DataGrid
          rowHeight={40}
          minHeight={500}
          rowKey="topicid"
          guidAutofillColumn="topicid"
          handleSave={this.handleSave}
          handleRemove={this.handleRemove}
          translatableFields={this.getTranslatableFields()}
          columns={this.getTopicColumns()}
          rows={this.props.watchlist} />
        : <div />
    );
  }
}

export default AdminWatchlist;