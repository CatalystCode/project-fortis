import React from 'react';
import constants from '../../actions/constants';
import DateTimePicker from 'react-widgets/lib/DateTimePicker';
import momentLocalizer from 'react-widgets/lib/localizers/moment';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { momentGetFromToRange, momentToggleFormats } from '../../utils/Utils.js';
import '../../styles/Insights/DataSelector.css';
import 'react-widgets/dist/css/react-widgets.css';
import '../../styles/Header.css';

const TimeSelectionOptions = [
    { label: '', timeType: 'customDatePlaceholder' },
    { label: 'Today', timeType: 'day', subtractFromNow: 0 },
    { label: 'Yesterday', timeType: 'day', subtractFromNow: 1 },
    { label: 'This Week', timeType: 'week', subtractFromNow: 0 },
    { label: 'Last Week', timeType: 'week', subtractFromNow: 1 },
    { label: 'This Month', timeType: 'month', subtractFromNow: 0 },
    { label: 'Last Month', timeType: 'month', subtractFromNow: 1 },
    { label: 'This Year', timeType: 'year', subtractFromNow: 0 },
    { label: 'Last Year', timeType: 'year', subtractFromNow: 1 },
    { label: 'Select Date', timeType: 'customDate', subtractFromNow: 0 },
    { label: 'Select Month', timeType: 'customMonth', subtractFromNow: 0 }
];

momentLocalizer(moment);
injectTapEventPlugin();

export default class DataSelector extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            timeType: '',
            selectedIndex: 0
        };
    }

    calendarOnChange(value, format) {
        this.setState({ timeType: '' });
    }

    cancelDateTimePicker = () => {
        this.setState({ timeType: '' });
    }

    refreshDashboard(timeSelection, timeType){
        const formatter = constants.TIMESPAN_TYPES[timeType];
        const dates = momentGetFromToRange(timeSelection, formatter.format, formatter.rangeFormat);
        const { fromDate, toDate } = dates;
        const { dataSource, maintopic, bbox, zoomLevel, termFilters, externalsourceid, selectedplace } = this.props;
        const dateType = this.customDateEntered(timeType) ? formatter.rangeFormat : timeType;

        this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, timeSelection, dateType, dataSource, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
    }

    handleChangeDate = (event, index, value) => {
        const selectionOption = TimeSelectionOptions[index];

        if (selectionOption.timeType.startsWith("custom")) {
            this.setState({timeType: value});
        } else {
            this.refreshDashboard(value, selectionOption.timeType);
        }
    }

    handleChangeDataSource = (event, index, value) => {
      const { timespanType, selectedplace, datetimeSelection, fromDate, toDate, maintopic, bbox, zoomLevel, termFilters, externalsourceid } = this.props;

      this.props.flux.actions.DASHBOARD.reloadVisualizationState(fromDate, toDate, datetimeSelection, timespanType, value, maintopic, bbox, zoomLevel, Array.from(termFilters), externalsourceid, null, selectedplace);
  }

    handleDatePickerChange = (dateObject, dateStr) => {
        const formatter = constants.TIMESPAN_TYPES[this.state.timeType];
        this.refreshDashboard(momentToggleFormats(dateStr, formatter.reactWidgetFormat, formatter.format), this.state.timeType);
        this.setState({ timeType: 'customDatePlaceholder' });
    }

    customDateEntered(dateType) {
        return dateType && dateType.startsWith("custom");
    }

    renderDateOptions = () => {
        return TimeSelectionOptions.map((timeOption, index) => {
            let timeValue;
            let label = timeOption.label;

            //if there is no custom date entered then skip adding the customDatePlaceholder option
            if (timeOption.timeType === 'customDatePlaceholder') {
                timeValue = this.props.datetimeSelection;
                label = timeValue;
                //format the pre defined date option
            } else if (!timeOption.timeType.startsWith("custom")) {
                timeValue = moment().subtract(timeOption.subtractFromNow, timeOption.timeType)
                .format(constants.TIMESPAN_TYPES[timeOption.timeType].format);
                //Either the custom date or custom date+time options
            } else {
                label = <div><i className="fa fa-calendar"></i>&nbsp;{label}</div>;
                timeValue = timeOption.timeType;
            }

            return <MenuItem key={`${timeValue}-${index}`} value={timeValue} primaryText={label} label={`Time range: ${timeOption.label}`} />
        });
    }

    render() {
        return (
            <div className="row dateRow">
                <div className="col-sm-12 dateFilterColumn">
                    {this.renderDataSourceFilter()}
                    {this.renderDateFilter()}
                </div>
            </div>
        );
    }

    renderDateFilter() {
        const showDatePicker = this.state.timeType && this.state.timeType === 'customDate' ? true : false;
        const showTimePicker = this.state.timeType && this.state.timeType === 'customDateTime' ? true : false;
        const showMonthSelector = this.state.timeType && this.state.timeType === 'customMonth' ? true : false;

        if (showDatePicker || showTimePicker || showMonthSelector) {
            const monthSelectorProps = showMonthSelector ? { initialView: "year", finalView: "year" } : {};

            return (
                <div className="input-group dateFilter">
                    <DateTimePicker value={new Date()}
                        onChange={this.handleDatePickerChange}
                        format={constants.TIMESPAN_TYPES[this.state.timeType].reactWidgetFormat}
                        time={showTimePicker}
                        {...monthSelectorProps} />

                    <button id="cancel-button" type="button" className="btn btn-danger btn-sm" onClick={this.cancelDateTimePicker}>
                        <span className="fa fa-times-circle-o" aria-hidden="true"></span>&nbsp;Cancel
                    </button>
                </div>
            );
        }

        return (
            <div className="input-group dateFilter">
                <SelectField key="dateSelection"
                    underlineStyle={{ borderColor: '#337ab7', borderBottom: 'solid 3px' }}
                    labelStyle={{ fontWeight: 600, color: '#2ebd59' }}
                    value={this.props.datetimeSelection}
                    onChange={this.handleChangeDate}>
                        {this.renderDateOptions()}
                </SelectField>
            </div>
        );
    }

    renderDataSourceFilter() {
        if (this.props.hideDataSourceFilter) {
            return null;
        }

        const options = [];
        for (const [source, value] of this.props.enabledStreams.entries()) {
            const label = <div><i className={value.icon}></i>&nbsp;{value.display}</div>;
            const key = `dataSource-${source}-${value.label}`;
            options.push(<MenuItem key={key} value={source} primaryText={label} label={`Data source: ${value.display}`} />);
        }

        return (
            <div>
                <SelectField key="dataSourceSelection"
                    underlineStyle={{ borderColor: '#337ab7', borderBottom: 'solid 3px' }}
                    labelStyle={{ fontWeight: 600, color: '#2ebd59' }}
                    value={this.props.dataSource}
                    onChange={this.handleChangeDataSource}>
                        {options}
                </SelectField>
            </div>
        );
    }
}