import React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import FontIcon from 'material-ui/FontIcon';
import '../../styles/Insights/ActiveFiltersView.css';
import { DEFAULT_EXTERNAL_SOURCE, DEFAULT_DATA_SOURCE } from '../../actions/constants';

function areSetsEqual(s1, s2) {
  if (s1 == null && s2 == null) return true;
  if (s1 == null || s2 == null) return false;
  if (s1.size !== s2.size) return false;

  let allEqual = true;
  s1.forEach(item => {
    if (!s2.has(s1)) {
      allEqual = false;
    }
  });
  return allEqual;
}

class ActiveFiltersView extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    const nextplaceid = (nextProps.selectedplace && nextProps.selectedplace.placeid) || "";
    const prevplaceid = (this.props.selectedplace && this.props.selectedplace.placeid) || "";

    if (nextProps && nextplaceid === prevplaceid &&
        nextProps.externalsourceid === this.props.externalsourceid &&
        nextProps.maintopic === this.props.maintopic &&
        areSetsEqual(nextProps.termFilters, this.props.termFilters) &&
        nextProps.dataSource === this.props.dataSource) {
      return false;
    }

    return true;
  }

  getChips = () => {
    const { dataSource, externalsourceid, selectedplace, maintopic, termFilters } = this.props;
    const chips = [];

    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE) {
      chips.push({
        type: 'dataSource',
        label: `Publisher: ${dataSource}`,
        icon: <FontIcon className="material-icons">find_in_page</FontIcon>,
        onDelete: this.props.deleteDataSource,
      });
    }

    if (externalsourceid && externalsourceid !== DEFAULT_EXTERNAL_SOURCE) {
      chips.push({
        type: 'externalsourceid',
        label: `Source: ${externalsourceid}`,
        icon: <FontIcon className="material-icons">share</FontIcon>,
        onDelete: this.props.deleteExternalSourceId,
      });
    }

    if (selectedplace.placeid) {
      chips.push({
        type: 'placeid',
        label: `Place: ${selectedplace.name}`,
        icon: <FontIcon className="material-icons">place</FontIcon>,
        onDelete: this.props.deleteSelectedPlace,
      });
    }

    if (maintopic) {
      chips.push({
        type: 'maintopic',
        label: `Topic: ${maintopic}`,
        icon: <FontIcon className="fa fa-tag" />,
        onDelete: this.props.deleteMainTopic,
      });
    }

    if (termFilters && termFilters.size) {
      chips.push({
        type: 'termFilters',
        label: `Filter${termFilters.size > 1 ? 's' : ''}: ${Array.from(termFilters).join(', ')}`,
        icon: <FontIcon className="fa fa-tags" />,
        onDelete: this.props.deleteTermFilters,
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
