import React from 'react';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';

export default class DrawerActionsIconButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  onClick = (value) => {
    this.props.onClick(value);
    this.setState({ open: false });
  }

  handleDrawerToggle = () => {
    this.setState({ open: !this.state.open });
  }

  handleDrawerChange = (open) => {
    this.setState({ open });
  }

  renderMenuItems() {
    return this.props.items.map((item) =>
      <MenuItem
        key={item}
        value={item}
        primaryText={this.props.formatText(item)}
        label={this.props.formatLabel(item)}
        onClick={() => this.onClick(item)}
      />
    );
  }

  render() {
    const { item, tooltipPosition, icon } = this.props;

    return (
      <div>
        <IconButton tooltip={this.props.formatTooltip(item)} tooltipPosition={tooltipPosition} onClick={this.handleDrawerToggle}>
          {icon}
        </IconButton>
        <Drawer
          docked={false}
          open={this.state.open}
          onRequestChange={this.handleDrawerChange}>
            {this.renderMenuItems()}
        </Drawer>
      </div>
    );
  }
}
