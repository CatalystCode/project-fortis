import React from 'react';
import ActionLanguage from 'material-ui/svg-icons/action/language';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import { fullWhite } from 'material-ui/styles/colors';

export default class LanguagePicker extends React.Component {
  changeLanguage = (event, index, value) => {
    this.props.flux.actions.DASHBOARD.changeLanguage(value, this.props.category);
  }

  renderMenuItems() {
    return this.props.supportedLanguages.map(lang =>
      <MenuItem key={lang} value={lang} primaryText={lang} label={`Language: ${lang}`} />
    );
  }

  renderMenuIcon() {
    const { language, tooltipPosition } = this.props;
    const tooltip = `Current language: '${language}'. Click to change language`;

    return (
      <IconButton tooltip={tooltip} tooltipPosition={tooltipPosition}>
        <ActionLanguage color={fullWhite} />
      </IconButton>
    );
  }

  render() {
    return (
      <IconMenu onChange={this.changeLanguage} iconButtonElement={this.renderMenuIcon()}>
        {this.renderMenuItems()}
      </IconMenu>
    );
  }
}
