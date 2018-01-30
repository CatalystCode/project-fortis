import React from 'react';
import Drawer from 'material-ui/Drawer';
import ActionLanguage from 'material-ui/svg-icons/action/language';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import { fullWhite } from 'material-ui/styles/colors';

export default class LanguagePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  changeLanguage = (language) => {
    this.props.onChangeLanguage(language);
    this.setState({ open: false });
  }

  handleDrawerToggle = () => {
    this.setState({ open: !this.state.open });
  }

  handleDrawerChange = (open) => {
    this.setState({ open });
  }

  renderMenuItems() {
    return this.props.supportedLanguages.map(language =>
      <MenuItem
        key={language}
        value={language}
        primaryText={`Set language to ${language}`}
        label={`Language: ${language}`}
        onClick={() => this.changeLanguage(language)}
      />
    );
  }

  render() {
    const { language, tooltipPosition } = this.props;
    const tooltip = `Current language: '${language}'. Click to change language`;

    return (
      <div>
        <IconButton tooltip={tooltip} tooltipPosition={tooltipPosition} onClick={this.handleDrawerToggle}>
          <ActionLanguage color={fullWhite} />
        </IconButton>
        <Drawer
          docked={false}
          width={200}
          open={this.state.open}
          onRequestChange={this.handleDrawerChange}>
            {this.renderMenuItems()}
        </Drawer>
      </div>
    );
  }
}
