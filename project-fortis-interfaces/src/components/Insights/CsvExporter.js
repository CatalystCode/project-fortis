import React from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton/IconButton';
import FileCloudDownload from 'material-ui/svg-icons/file/cloud-download';
import { fullWhite } from 'material-ui/styles/colors';

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
    const tooltip = 'Click to export current view to Excel';
    const tooltipPosition = this.props.tooltipPosition;

    return (
      <div>
        <IconButton tooltip={tooltip} tooltipPosition={tooltipPosition} onClick={this.handleDrawerToggle}>
          <FileCloudDownload color={fullWhite} />
        </IconButton>
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
