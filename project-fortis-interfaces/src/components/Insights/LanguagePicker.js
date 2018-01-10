import React from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class LanguagePicker extends React.Component {
  changeLanguage = (event, index, value) => {
    this.props.flux.actions.DASHBOARD.changeLanguage(value, this.props.category);
  }

  render() {
    const languages = this.props.supportedLanguages.map(lang =>
      <MenuItem key={lang} value={lang} primaryText={lang} label={`Language: ${lang}`} />
    );

    return (
      <SelectField
        underlineStyle={{ borderColor: '#337ab7', borderBottom: 'solid 3px' }}
        labelStyle={{ fontWeight: 600, color: '#2ebd59' }}
        value={this.props.language}
        autoWidth={true}
        onChange={this.changeLanguage}>
          {languages}
      </SelectField>
    );
  }
}
