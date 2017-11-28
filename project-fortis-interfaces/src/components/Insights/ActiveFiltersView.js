import React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import FontIcon from 'material-ui/FontIcon';
import '../../styles/Insights/ActiveFiltersView.css';
import { DEFAULT_EXTERNAL_SOURCE, DEFAULT_DATA_SOURCE } from '../../actions/constants';
import { extractHostnameIfExists, fetchTermFromMap } from './shared';

class ActiveFiltersView extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    const nextplaceid = (nextProps.selectedplace && nextProps.selectedplace.placeid) || "";
    const prevplaceid = (this.props.selectedplace && this.props.selectedplace.placeid) || "";

    if (nextProps && nextplaceid === prevplaceid &&
        nextProps.externalsourceid === this.props.externalsourceid &&
        nextProps.maintopic === this.props.maintopic &&
        nextProps.language === this.props.language &&
        nextProps.conjunctiveTermsLength === this.props.conjunctiveTermsLength &&
        nextProps.dataSource === this.props.dataSource) {
      return false;
    }

    return true;
  }

  getChips = () => {
    const { dataSource, externalsourceid, selectedplace, maintopic, 
            termFilters, enabledStreams, allSiteTopics } = this.props;
    const chips = [];
    const edge = fetchTermFromMap(allSiteTopics, maintopic);

    if (maintopic) {
      chips.push({
        type: 'maintopic',
        label: `Topic: ${edge.translatedname}`,
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

    if (selectedplace.placeid) {
      chips.push({
        type: 'placeid',
        label: `Place: ${selectedplace.name}`,
        icon: <FontIcon className="material-icons">place</FontIcon>,
        onDelete: this.props.deleteSelectedPlace,
      });
    }

    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE) {
      const icon = enabledStreams.get(dataSource).icon;
      
      chips.push({
        type: 'dataSource',
        label: `Publisher: ${dataSource}`,
        icon: <i className={icon} />,
        //icon: <FontIcon className="material-icons">find_in_page</FontIcon>,
        onDelete: this.props.deleteDataSource,
      });
    }

    if (externalsourceid && externalsourceid !== DEFAULT_EXTERNAL_SOURCE) {
      chips.push({
        type: 'externalsourceid',
        label: `Source: ${extractHostnameIfExists(externalsourceid)}`,
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
