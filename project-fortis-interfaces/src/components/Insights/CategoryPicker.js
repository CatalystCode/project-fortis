import React from 'react';
import ContentFilterList from 'material-ui/svg-icons/content/filter-list';
import { fullWhite } from 'material-ui/styles/colors';
import DrawerActionsIconButton from './DrawerActionsIconButton';

const CATEGORY_ALL = '';

export default class CategoryPicker extends React.Component {
  formatCategory = (category) => category || 'all';
  formatText = (category) => `Reload with category '${this.formatCategory(category)}'`;
  formatLabel = (category) => `Category: ${this.formatCategory(category)}`;
  formatTooltip = (category) => `Current category: '${this.formatCategory(category)}'. Click to change category`;

  render() {
    const { category, allCategories, tooltipPosition, onChangeCategory } = this.props;

    return (
      <DrawerActionsIconButton
        onClick={onChangeCategory}
        items={allCategories.concat(CATEGORY_ALL)}
        item={category}
        formatText={this.formatText}
        formatLabel={this.formatLabel}
        formatTooltip={this.formatTooltip}
        icon={<ContentFilterList color={fullWhite} />}
        tooltipPosition={tooltipPosition}
      />
    );
  }
}
