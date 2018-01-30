import React from 'react';
import ActionLanguage from 'material-ui/svg-icons/action/language';
import { fullWhite } from 'material-ui/styles/colors';
import DrawerActionsIconButton from './DrawerActionsIconButton';

export default class LanguagePicker extends React.Component {
  formatText = (language) => `Set language to '${language}'`;
  formatLabel = (language) => `Language: ${language}`;
  formatTooltip = (language) => `Current language: '${language}'. Click to change language`;

  render() {
    const { language, supportedLanguages, tooltipPosition, onChangeLanguage } = this.props;

    return (
      <DrawerActionsIconButton
        onClick={onChangeLanguage}
        items={supportedLanguages}
        item={language}
        formatText={this.formatText}
        formatLabel={this.formatLabel}
        formatTooltip={this.formatTooltip}
        icon={<ActionLanguage color={fullWhite} />}
        tooltipPosition={tooltipPosition}
      />
    );
  }
}
