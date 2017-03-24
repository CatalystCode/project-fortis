import React, { Component } from 'react';
import {LineChart, XAxis, CartesianGrid, YAxis, Tooltip, Legend, ResponsiveContainer} from 'recharts';

class Timeline extends Component {
    render() {
        return (
                <ResponsiveContainer>
                    <LineChart fill={this.props.fill} 
                               data={this.props.data} 
                               margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                        <XAxis dataKey={this.props.dataKey}
                               tickFormatter={this.props.tickFormatter} 
                               minTickGap={10}/>
                        <YAxis type="number" domain={[0, 'dataMax + 20']}/>
                        <Tooltip/>
                        <CartesianGrid strokeDasharray="2 2"/>
                        <Legend/>
                        {this.props.children}
                    </LineChart>
                </ResponsiveContainer>
            );
   }
}

Timeline.propTypes = {
  	data: React.PropTypes.array.isRequired,
    dataKey: React.PropTypes.string.isRequired,
    tickFormatter: React.PropTypes.func,
    fill: React.PropTypes.string
}

export default Timeline;