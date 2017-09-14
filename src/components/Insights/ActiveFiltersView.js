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
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE) {
      chips.push({
        type: 'dataSource',
        label: `Publisher: ${dataSource}`,
        icon: <FontIcon className="material-icons">find_in_page</FontIcon>,
        onDelete: this.props.deleteDataSource,
      });
    }

    const externalsourceid = this.props.externalsourceid;
    if (externalsourceid && externalsourceid !== DEFAULT_EXTERNAL_SOURCE) {
      chips.push({
        type: 'externalsourceid',
        label: `Source: ${externalsourceid}`,
        icon: <FontIcon className="material-icons">share</FontIcon>,
        onDelete: this.props.deleteExternalSourceId,
      });
    }

    return chips;
  }

  renderChip = (chip) => {
    return (
      <Chip key={chip.type} onRequestDelete={chip.onDelete} className="active-filters-view--chip">
        <Avatar icon={chip.icon} />
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
