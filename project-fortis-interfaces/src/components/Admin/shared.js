const DEFAULT_COLUMN = {
  editable: false,
  filterable: false,
  resizable: true
};

function getColumns(columnValues) {
  return columnValues.map(value => Object.assign({}, DEFAULT_COLUMN, value));
}

module.exports = {
  getColumns
};