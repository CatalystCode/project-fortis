import React from 'react';
import ContentFilterList from 'material-ui/svg-icons/content/filter-list';
import { fullWhite } from 'material-ui/styles/colors';
import DrawerActionsIconButton from './DrawerActionsIconButton';

export default class CategoryPicker extends React.Component {
  formatText = (category) => `Reload with category '${category}'`;
  formatLabel = (category) => `Category: ${category}`;
  formatTooltip = (category) => `Current category: '${category}'. Click to change category`;

  render() {
    const { category, allCategories, tooltipPosition, onChangeCategory } = this.props;

    return (
      <DrawerActionsIconButton
        onClick={onChangeCategory}
        items={allCategories}
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
