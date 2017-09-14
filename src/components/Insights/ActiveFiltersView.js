import React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import FontIcon from 'material-ui/FontIcon';
import '../../styles/Insights/ActiveFiltersView.css';
import { DEFAULT_EXTERNAL_SOURCE, DEFAULT_DATA_SOURCE } from '../../actions/constants';

class ActiveFiltersView extends React.Component {
  getChips = () => {
    const chips = [];

    const dataSource = this.props.dataSource;
    if (dataSource) {
      chips.push({
        type: 'dataSource',
        label: `Publisher: ${dataSource}`,
        icon: 'find_in_page',
        onDelete: dataSource === DEFAULT_DATA_SOURCE
          ? undefined
          : this.props.deleteDataSource,
      });
    }

    const externalsourceid = this.props.externalsourceid;
    if (externalsourceid) {
      chips.push({
        type: 'externalsourceid',
        label: `Source: ${externalsourceid}`,
        icon: 'share',
        onDelete: externalsourceid === DEFAULT_EXTERNAL_SOURCE
          ? undefined
          : this.props.deleteExternalSourceId,
      });
    }

    return chips;
  }

  renderChip = (chip) => {
    return (
      <Chip key={chip.type} onRequestDelete={chip.onDelete} className="active-filters-view--chip">
        <Avatar icon={<FontIcon className="material-icons">{chip.icon}</FontIcon>} />
        <div className="active-filters-view--chip--label-container" title={chip.label}>
          {chip.label}
        </div>
      </Chip>
    );
  }

  render() {
    return (
      <div className="active-filters-view">
        {this.getChips().map(this.renderChip)}
      </div>
    );
  }
}

export default ActiveFiltersView;
