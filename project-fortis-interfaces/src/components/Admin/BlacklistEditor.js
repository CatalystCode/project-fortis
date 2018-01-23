import { DataGrid } from './DataGrid';
import React from 'react';
import { getColumns } from './shared';
const { Editors, Formatters } = require('react-data-grid-addons');
const { DropDownEditor } = Editors;
const { DropDownFormatter } = Formatters;

const booleans = ['false', 'true'];

class BlacklistEditor extends React.Component {
  componentDidMount() {
    this.props.flux.actions.ADMIN.load_blacklist();
  }

  handleSave = rows => {
    this.prepareBlacklistForSave(rows);
    this.props.flux.actions.ADMIN.save_blacklist(rows);
  }

  handleRemove = rows => {
    this.props.flux.actions.ADMIN.remove_blacklist(rows);
  }

  getBlacklistColumns = () => {
    const columnValues = [
      {editable: true, filterable: true, sortable: true, key: "filteredTerms", name: "Blacklisted Terms"},
      {editable: true, filterable: true, sortable: true, key: "isLocation", name: "Is location?", editor: <DropDownEditor options={booleans}/>, formatter: <DropDownFormatter options={booleans}/>}
    ];

    return getColumns(columnValues);
  }

  prepareBlacklistForSave(rows) {
    rows.forEach((row, index) => {
      if (this.isEmptyBlacklistRow(row)) {
        rows.splice(index, 1);
      } else {
        this.formatBlacklistRowForCassandra(row);
      }
    });
  }

  isEmptyBlacklistRow(row) {
    return !row || !row.filteredTerms || row.filteredTerms.length === 0;
  }

  formatBlacklistRowForCassandra(row) {
    if (row.filteredTerms.indexOf(',') < 0) return row;
    row.filteredTerms = row.filteredTerms.split(",").map(term => term.trim());
    row.isLocation = (row.isLocation === 'true');
    return row;
  }

  render() {
    return (
      this.getBlacklistColumns().length <= 0 ?
        <div /> :
        <div>
          <DataGrid
            rowHeight={40}
            minHeight={500}
            rowKey="id"
            guidAutofillColumn="id"
            handleSave={this.handleSave}
            handleRemove={this.handleRemove}
            columns={this.getBlacklistColumns()}
            rows={this.props.blacklist} />
          </div>
    );
  }
};

export default BlacklistEditor;