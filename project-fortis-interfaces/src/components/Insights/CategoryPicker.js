import React from 'react';
import Drawer from 'material-ui/Drawer';
import ContentFilterList from 'material-ui/svg-icons/content/filter-list';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import { fullWhite } from 'material-ui/styles/colors';

export default class CategoryPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  changeCategory = (category) => {
    this.props.onChangeCategory(category);
    this.setState({ open: false });
  }

  handleDrawerToggle = () => {
    this.setState({ open: !this.state.open });
  }

  handleDrawerChange = (open) => {
    this.setState({ open });
  }

  renderMenuItems() {
    return this.props.allCategories.map(category =>
      <MenuItem
        key={category}
        value={category}
        primaryText={`Set category to ${category}`}
        label={`Category: ${category}`}
        onClick={() => this.changeCategory(category)}
      />
    );
  }

  render() {
    const { category, tooltipPosition } = this.props;
    const tooltip = `Current category: '${category}'. Click to change category`;

    return (
      <div>
        <IconButton tooltip={tooltip} tooltipPosition={tooltipPosition} onClick={this.handleDrawerToggle}>
          <ContentFilterList color={fullWhite} />
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
