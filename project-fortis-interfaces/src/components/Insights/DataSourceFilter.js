import RadioButton from 'material-ui/RadioButton';
import RadioButtonGroup from 'material-ui/RadioButton/RadioButtonGroup';
import React from 'react';

const styles={
    label: {
        color: 'rgb(46, 189, 89)',
        verticalAlign: 'top',
        paddingLeft: '5px'
    },
    labelContainer: {
        display: 'float'
    },
    buttonGroup:{
        display: 'inline-flex',
        marginTop: '7px',
        marginLeft: '7px'
    },
    radioButton: {
        width: "auto",
        float: "left",
        marginRight: "20px",
        marginLeft: "5px"
    },
    radioLabel: {
        width: 'auto'
    }
};

export default class DataSourceFilter extends React.Component {
  radioButtonChanged(e, value){
      const { timespanType, selectedplace, datetimeSelection, fromDate, toDate, maintopic, bbox, zoomLevel, termFilters, externalsourceid } = this.props;
    
      this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, value, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
  }

  renderDataSourceRadioOpts(iconStyle){
    let buttons = [];
    const { enabledStreams } = this.props;

    for (let [source, value] of enabledStreams.entries()) {
        buttons.push(<RadioButton labelStyle={styles.radioLabel} style={styles.radioButton} key={source} value={source} label={<div style={styles.labelContainer}><i style={iconStyle} className={value.icon}></i><span style={styles.label}>{value.display}</span></div>} />)
    }

    return <RadioButtonGroup onChange={(e, value)=>this.radioButtonChanged(e, value)} 
                             style={styles.buttonGroup} 
                             name="filters" 
                             valueSelected={this.props.dataSource}>
            {buttons}
           </RadioButtonGroup>;
  }

  render(){
      const iconStyle = {
        color: "#337ab7"
      };

      return this.renderDataSourceRadioOpts(iconStyle);
  }
}

