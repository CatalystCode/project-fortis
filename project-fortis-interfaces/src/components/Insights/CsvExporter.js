import React from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';

class CsvExporter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      open: false
    };
  }

  handleDrawerToggle = () => {
    if (!this.hasCsv()) {
      this.fetchCsvs();
    }
    this.setState({open: !this.state.open});
  }

  handleDrawerChange = (open) => {
    this.setState({open});
  }

  render() {
    return (
      <div style={{paddingTop: '1em'}}>
        <RaisedButton
          label="Export to Excel"
          icon={<FontIcon className="fa fa-table" />}
          onClick={this.handleDrawerToggle} />
        <Drawer
          docked={false}
          width={200}
          open={this.state.open}
          onRequestChange={this.handleDrawerChange}>
            {this.renderDrawerContent()}
        </Drawer>
      </div>
    );
  }

  renderDrawerContent() {
    if (this.state.loading) {
      return (
        <MenuItem>Generating reports...</MenuItem>
      );
    }

    const csvsToRender = this.props.csvs.filter(csv => !!csv.url);
    return csvsToRender.map(this.renderCsv);
  }

  renderCsv(csv) {
    return (
      <MenuItem key={csv.url}>
        <a href={csv.url}>
          {csv.name}
        </a>
      </MenuItem>
    );
  };

  fetchCsvs() {
    if (!this.state.loading) {
      this.props.fetchCsvs();
      this.setState({loading: true});
    }
  }

  hasCsv(props) {
    props = props || this.props;
    return props.csvs.some(csv => !!csv.url);
  }

  componentWillReceiveProps(nextProps) {
    const isCsvReady = this.hasCsv(nextProps);
    if (isCsvReady) {
      this.setState({loading: false});
    }
  }
}

export default CsvExporter;
