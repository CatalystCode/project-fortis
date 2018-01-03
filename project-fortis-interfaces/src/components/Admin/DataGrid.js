import { SERVICES } from '../../services/Dashboard';
import ReactDataGrid from 'react-data-grid';
import React from 'react';
import createReactClass from 'create-react-class';
import Fluxxor from 'fluxxor';
import moment from 'moment';
// eslint-disable-next-line
import { guid } from '../../utils/Utils.js';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');
const STATE_ACTIONS = {
  SAVED: "saved",
  SAVING: "saving",
  MODIFIED: "changed",
  TRANSLATED: "translated",
  TRANSLATING: "translating"
};

const FluxMixin = Fluxxor.FluxMixin(React);
const StoreWatchMixin = Fluxxor.StoreWatchMixin("AdminStore", "DataStore");
const RowRenderer = createReactClass({
  getRowStyle: function() {
    return {
      color: this.getRowBackground()
    }
  },
  getRowBackground: function() {
    const modifiedRows = this.props.modifiedRows;

    return modifiedRows.has(this.props.row[this.props.rowKey]) ? 'green' : '#000'
  },
  render: function() {
    return (<div style={this.getRowStyle()}><ReactDataGrid.Row forceUpdate={true} {...this.props}/></div>)
  }
});

const styles = {
  rowSelectionLabel: {
    marginLeft: '8px',
    marginRight: '8px'
  },
  actionButton: {
    marginLeft: '5px'
  }
}
export const DataGrid = createReactClass({
  mixins: [FluxMixin, StoreWatchMixin],
  getInitialState() {
    return {
      rows : [],
      filters : {},
      localAction: false,
      modifiedRows: new Set(),
      sortDirection: 'NONE',
      selectedRowKeys: [],
      coordinates: {}
    }
  },
  getStateFromFlux() {
    const flux = this.getFlux();
    return Object.assign({}, flux.store("DataStore").getState(), flux.store("AdminStore").getState());
  },
  componentDidMount() {
    document.body.addEventListener('paste', this.handlePaste);
  },
  setStateAsSaving() {
    this.setState({localAction: STATE_ACTIONS.SAVING, selectedRowKeys: [], filters: {}});
  },
  componentWillReceiveProps(nextProps) {
    let selectedRowKeys = this.state.selectedRowKeys;
    let modifiedRows = this.state.modifiedRows;
    let localAction = this.state.localAction;
    let filters = this.state.filters;
    const rowsToRemove = nextProps.rowsToRemove;
    const rowsToMerge = nextProps.rowsToMerge;
    let state = this.state;
    let rows = this.state.rows.length === 0 || nextProps.rows ? nextProps.rows : this.state.rows;

    //if the action state === SAVED and the modified rows set has been cleared then mark the state as saved
    if(state.action === STATE_ACTIONS.SAVED && localAction === STATE_ACTIONS.SAVING){
        localAction = STATE_ACTIONS.SAVED;
        rows = nextProps.rows;
    }else{
        //if the parent component marks rows to be selected
        if(nextProps.selectedRowKeys){
            //merge the requested row keys as selected
          selectedRowKeys = Array.from(nextProps.selectedRowKeys);
        }

        //if the parent component marks rows to be discarded
        if(rowsToRemove && rowsToRemove.length > 0){
              rowsToRemove.forEach(rowKey=>{
                  let rowIndex = this.lookupRowIdByKey(rowKey);
                  if(rowIndex > -1){
                      rows.splice(rowIndex, 1);
                      modifiedRows.delete(rowKey);
                  }
              });
          }

          //if there's rows which the parent component would like to merge onto the grid
          if(rowsToMerge && rowsToMerge.length > 0){
              //grab a list of new row keys to add to the grid
              const existingRowKeys = rows.map(row=>row[this.props.rowKey]);
              const newRowKeys = rowsToMerge.map(row=>row[this.props.rowKey]);
              //make sure the row is not added as a dupe.
              const rowsToAdd = rowsToMerge.filter(row=>existingRowKeys.indexOf(row[this.props.rowKey]) === -1);
              //merge the new rows with the existing rows
              rows = rowsToAdd.concat(rows);
              //mark the newly added rows as modified
              modifiedRows = new Set(Array.from(modifiedRows).concat(Array.from(newRowKeys)));
          }

          //mark the state of the grid as MODIFIED if the modified rowset isnt empty
          if(modifiedRows.size > 0){
              localAction = STATE_ACTIONS.MODIFIED;
          }
    }

    this.setState({rows, localAction, selectedRowKeys, modifiedRows, filters});
  },
  lookupRowIdByKey(rowKey) {
    let targetRowId = -1;
    this.state.rows.forEach((row, index)=>{
      if(row[this.props.rowKey] === rowKey) {
          targetRowId = index;
      }
    });

    return targetRowId;
  },
  onCellSelected(coordinates) {
    this.setState({selectedRow: coordinates.rowIdx, selectedColumn: coordinates.idx - 1});
  },
  removeSelectedRows(){
    //grab the rowKeys for all selected rows
    const selectedRows = this.state.rows.filter(row=>this.state.selectedRowKeys.indexOf(row[this.props.rowKey]) > -1)
                                        .map(row=>{
                                                  delete row.isSelected;

                                                  return row;
                                          });

    //remove any selected rows that were marked as modified
    let modifiedRows = new Set(Array.from(this.state.modifiedRows).filter(rowKey => this.state.selectedRowKeys.indexOf(rowKey) === -1));

    const selectedRowKeys = [];

    this.setState({filters: {}, localAction: STATE_ACTIONS.SAVING, modifiedRows: modifiedRows, selectedRowKeys});
    this.props.handleRemove(selectedRows);
  },
  getRows() {
    return Selectors.getRows(this.state);
  },
  getSize() {
      //return this.state.rows.length;
      return Selectors.getRows(this.state).length;
  },
  handleAddRow(e){
    let newRow = {}, rows = this.state.rows || [];

    this.props.columns.forEach(column=>{
      newRow[column.key] = "";
    });

    if(this.props.guidAutofillColumn) {
      newRow[this.props.guidAutofillColumn] = guid();
    }

    rows.push(newRow);

    this.setState({rows});
  },
  handleGridRowsUpdated(updatedRowData) {
      let rows = this.state.rows;
      const localAction = STATE_ACTIONS.MODIFIED;
      let modifiedRows = this.state.modifiedRows;

      //find the row thats being modified, and bind the new properties from updatedRowData
      updatedRowData.rowIds.forEach(rowKey=> {
          let rowId = this.lookupRowIdByKey(rowKey);
          const rowContents = rows[rowId];
          Object.keys(updatedRowData.updated).forEach(field => {
              if (rowContents[field] !== updatedRowData.updated[field]) {
                  modifiedRows.add(rowKey);

                  let column = this.props.columns[this.state.selectedColumn];
                  if (column.validateWithPromise) {
                      let validationResult = column.validateWithPromise(updatedRowData.updated[field]);
                      validationResult.then(() => {
                          this.setState({ modifiedRows, localAction, rows });
                      }, (result) => {
                          if (result) {
                              alert(result);
                          }

                          modifiedRows.delete(rowKey);
                          this.setState({ modifiedRows, localAction, rows});
                      });
                  }
              }
          });

          const updatedRow = Object.assign({}, rowContents, updatedRowData.updated);
          rows[rowId] = updatedRow;
      });

      this.setState({modifiedRows, localAction, rows});
  },
  rowGetter(index) {
    return Selectors.getRows(this.state)[index];
  },

  isEmptyObject(obj) {
    return Object.getOwnPropertyNames(obj).length === 0;
  },
  onClearFilters() {
    this.setState({filters: {} });
  },
  handleGridSort(sortColumn, sortDirection) {
    this.setState({sortColumn, sortDirection});
  },
  handlePaste(e) {
      const pastedText = e.clipboardData.getData('text/plain');
      let currentRow = this.state.selectedRow;
      let currentColumn = this.state.selectedColumn;
      let rows = this.state.rows, localAction = STATE_ACTIONS.MODIFIED;
      let modifiedRows = this.state.modifiedRows;
      const activeColumn = currentColumn > -1 ? this.props.columns[currentColumn] : undefined;

      if(pastedText && currentColumn  > -1 && activeColumn.key !== (this.props.guidAutofillColumn || "")){
          const pastedRows = pastedText.split("\n").filter(x => x);
          pastedRows.forEach(pastedRow => {
              const columnData = pastedRow.split("\t").filter(x => x);
              currentColumn = this.state.selectedColumn;
              let rowData = currentRow < rows.length ? rows[currentRow] : {};
              if(this.props.guidAutofillColumn && !rowData[this.props.guidAutofillColumn]){
                  rowData[this.props.guidAutofillColumn] = guid();
              }

              if(pastedRow !== ""){
                columnData.forEach(pastedColumn => {
                    if(currentColumn < this.props.columns.length){
                        let colData = {};
                        colData[this.props.columns[currentColumn].key] = pastedColumn.replace(/[\n\r]/g, '');
                        rowData = Object.assign({}, rowData, colData);
                    }
                    currentColumn++
                });

                if(currentRow < rows.length){
                    rows[currentRow] = rowData;
                }else{
                    rows.push(rowData);
                }
              }

              modifiedRows.add(rowData[this.props.rowKey]);
              currentRow++;
          });

          this.setState({rows, localAction, modifiedRows});
      }else if(this.props.guidAutofillColumn && activeColumn && activeColumn.key === this.props.guidAutofillColumn){
          alert("Not allowed to paste into the RowId column.");
      }
    },
    validDataRow(row, uniqueDataMap){
        let validRow = true;

        this.props.columns.forEach(column => {
            if(validRow && column.required && row[column.key] === ""){
                alert(`required column [${column.key}] is missing values.`);

                validRow = false;
            }else if(validRow && column.expectedDateFormat && !moment(row[column.key], column.expectedDateFormat, true).isValid()){
                alert(`${row[column.key]} is not a valid date. Expecting format ${column.expectedDateFormat}. \nDegug[${JSON.stringify(row)}]`);

                validRow = false;
            }else if(validRow && column.validateWithPromise){
                 let validationResult = column.validateWithPromise(row[column.key]);
                    validationResult.then(() => {
                      }, (result) => {
                          if (result) {
                              alert(result);
                          }
                      });
            }else if(validRow && column.validateWith){
                let validationResult = column.validateWith(row[column.key]);
                if(validationResult){
                    alert(validationResult);
                    validRow = false;
                }
            }

            if(validRow && column.compositeKey){
                let valueSet = uniqueDataMap.get(column.key);

                if(!valueSet){
                    valueSet = new Set();
                }

                if(valueSet.has(row[column.key])){
                    alert(`Duplicate unique key error for column [${column.name}] item [${row[column.key]}] rowId: [${row[this.props.rowKey]}].\nDegug[${JSON.stringify(row)}]`);

                    validRow = false;
                }else{
                    valueSet.add(row[column.key]);
                    uniqueDataMap.set(column.key, valueSet);
                }
            }
        });

        return validRow;
    },
    handleSave(){
        let uniqueDataMap = new Map();
        let invalidData = false;
        let modifiedRows = this.state.modifiedRows;

        this.state.rows.forEach(row => {
            if(!this.validDataRow(row, uniqueDataMap)){
                invalidData = true;
            }
        });

        if (!invalidData) {
            const mutatedRows = this.state.rows.filter(row=>modifiedRows.has(row[this.props.rowKey]));
            //only save the grid rows that were modified to minimize unneccesary service mutations.
            modifiedRows.clear();
            this.setState({localAction: STATE_ACTIONS.SAVING, filters: {}, modifiedRows, selectedRowKeys: []});
            this.props.handleSave(mutatedRows, this.state.columns);
        } else {
          return false;
        }
    },
    onRowsSelected(rows) {
        this.setState({selectedRowKeys: this.state.selectedRowKeys.concat(rows.map(r => r.row[this.props.rowKey]))});
    },
    onRowsDeselected(rows) {
        var rowIndexes = rows.map(r => r.row[this.props.rowKey]);
        this.setState({selectedRowKeys: this.state.selectedRowKeys.filter(i => rowIndexes.indexOf(i) === -1 )});
    },
    handleFilterChange(filter) {
      let newFilters = Object.assign({}, this.state.filters);

      if (filter.filterTerm) {
        newFilters[filter.column.key] = filter;
      } else {
        delete newFilters[filter.column.key];
      }

      this.setState({filters: newFilters});
    },
    translateSelectedRows() {
      const { sourceField, targetField } = this.props.translatableFields;
      let selectedRowKeys = this.state.selectedRowKeys;
      let self = this;
      let modifiedRows = this.state.modifiedRows;
      this.setState({localAction: STATE_ACTIONS.TRANSLATING});
      let phrasesToTranslate = this.state.rows.filter(row=>selectedRowKeys.indexOf(row[this.props.rowKey]) > -1)
                                                .map(row=>row[sourceField.key]);

      phrasesToTranslate = this.removeUnsetPhrasesToTranslate(phrasesToTranslate);

      SERVICES.translateSentences(phrasesToTranslate, sourceField.language, targetField.language, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const translationMap = new Map();

          if (body && body.data && body.data.translateWords && body.data.translateWords.words && body.data.translateWords.words.length) {
            body.data.translateWords.words.forEach(translatedPhrase=>{
                translationMap.set(translatedPhrase.originalSentence, translatedPhrase.translatedSentence);
            });
          }

          const mutatedRows = this.state.rows.map(row => {
            const translatedPhrase = translationMap.get(row[sourceField.key]);
            if (translatedPhrase) {
                row[targetField.key] = translatedPhrase;
                modifiedRows.add(row[self.props.rowKey])
                selectedRowKeys.splice(selectedRowKeys.indexOf(row[self.props.rowKey]), 1);
            }
            return row;
          });

          self.setState({
            modifiedRows: modifiedRows,
            localAction: STATE_ACTIONS.TRANSLATED,
            rows: mutatedRows,
            selectedRowKeys: selectedRowKeys
          });
        } else {
          console.error(`[${error}] occured while processing translation request`);
        }
      });
    },

    removeUnsetPhrasesToTranslate(phrases) {
      return phrases.filter(phrases => phrases);
    },

    getValidFilterValues(columnId) {
      let values = this.state.rows.map(r => r[columnId]);
      return values.filter((item, i, a) => { return i === a.indexOf(item); });
    },

    hasPhrasesToTranslate() {
      if (!this.props.translatableFields) return;
      const { sourceField } = this.props.translatableFields;
      const selectedRowKeys = this.state.selectedRowKeys;
      const phrasesToTranslate = this.state.rows.filter(row => selectedRowKeys.indexOf(row[this.props.rowKey]) > -1)
                                                .map(row => row[sourceField.key])
                                                .filter(row => row.length > 0);
      if (phrasesToTranslate.length > 0) return true;
      else return false;
    },

    showUploadChangesButton() {
      return this.state.localAction && this.state.rows.length > 0 && this.state.selectedRowKeys.length > 0;
    },

    render() {
        let rowText = this.state.selectedRowKeys.length === 1 ? 'row' : 'rows';
        let toolBarProps = {};
        let saveButtonState;

        switch(this.state.localAction){
            case STATE_ACTIONS.MODIFIED: saveButtonState = "Upload Changes";
                break;
            case STATE_ACTIONS.SAVING: saveButtonState = "Saving...";
                break;
            case STATE_ACTIONS.TRANSLATING: saveButtonState = "Translating...";
                break;
            case STATE_ACTIONS.TRANSLATED: saveButtonState = "Save Translations";
                break;
            default:
                saveButtonState = "Saved Changes";
        }

        if(!this.props.rowAddDisabled){
            toolBarProps.onAddRow = this.handleAddRow;
        }

        return (
          <div>
            {
                this.showUploadChangesButton() ?
                       <button style={styles.actionButton}
                                onClick={this.handleSave}
                                type="button"
                                className={this.state.localAction === STATE_ACTIONS.MODIFIED || this.state.localAction === STATE_ACTIONS.SAVING || this.state.localAction === STATE_ACTIONS.TRANSLATED ? `btn btn-primary btn-sm` : `btn btn-success btn-sm`}
                                disabled={this.state.localAction === STATE_ACTIONS.SAVING || this.state.localAction === STATE_ACTIONS.TRANSLATING || this.state.localAction === STATE_ACTIONS.TRANSLATING }>
                             <i className="fa fa-cloud-upload" aria-hidden="true"></i> {saveButtonState}
                       </button>
                   : undefined
            }
            {
                this.state.selectedRowKeys.length > 0 && this.state.localAction !== STATE_ACTIONS.SAVING ?
                       <button style={styles.actionButton} onClick={this.removeSelectedRows} type="button" className="btn btn-danger btn-sm">
                             <i className="fa fa-remove" aria-hidden="true"></i> Remove Selection(s)
                       </button>
                   : undefined
            }
            {
              this.hasPhrasesToTranslate() ?
                <button style={styles.actionButton} onClick={this.translateSelectedRows} type="button" className="btn btn-default btn-sm">
                  <i className="fa fa-language" aria-hidden="true"></i> Translate Selection(s)
                </button>
              : undefined
            }
            <span style={styles.rowSelectionLabel}>{this.state.selectedRowKeys.length} {rowText} selected</span>
            <ReactDataGrid
                  ref="grid"
                  onGridSort={this.handleGridSort}
                  enableCellSelect={true}
                  onCellCopyPaste={null}
                  onCellSelected={this.onCellSelected}
                  rowGetter={this.rowGetter}
                  rowRenderer={<RowRenderer rowKey={this.props.rowKey}
                                            modifiedRows={this.state.modifiedRows}/>}
                  onGridRowsUpdated={this.handleGridRowsUpdated}
                  toolbar={<Toolbar enableFilter={true} {...toolBarProps}/>}
                  getValidFilterValues={this.getValidFilterValues}
                  onAddFilter={this.handleFilterChange}
                  rowsCount={this.getSize()}
                  onClearFilters={this.onClearFilters}
                  rowSelection={{
                        showCheckbox: true,
                        enableShiftSelect: true,
                        onRowsSelected: this.onRowsSelected,
                        onRowsDeselected: this.onRowsDeselected,
                        selectBy: {
                            keys: {rowKey: this.props.rowKey, values:this.state.selectedRowKeys}
                        }
                 }}
                 {...this.props} />
         </div>
        );
    }
});