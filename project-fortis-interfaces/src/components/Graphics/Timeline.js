import React, { Component } from 'react';
import numeralLibs from 'numeral';
import { AreaChart, XAxis, CartesianGrid, Brush, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const toNumericDisplay = (decimal, fixed = 0) => {
    return numeralLibs(decimal).format(decimal > 1000 ? '+0.0a' : '0a');
};

class Timeline extends Component {
    
    render() {
        return (
            <ResponsiveContainer>
                <AreaChart fill={this.props.fill}
                    data={this.props.data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey={this.props.dataKey}
                        tickFormatter={this.props.tickFormatter}/>
                    <YAxis type="number" tickFormatter={toNumericDisplay}/>
                    <Tooltip />
                    <Brush height={25}
                        onChange={range=>this.props.dateRangeChanged(range)}
                        dataKey={this.props.dataKey} >
                        <AreaChart data={this.props.data} fill={this.props.fill}>
                            <CartesianGrid />
                            <YAxis hide domain={['auto', 'auto']} />
                            {this.props.children}
                        </AreaChart>
                    </Brush>
                    <CartesianGrid strokeDasharray="2 2" />
                    <Legend verticalAlign="top" height={26} />
                    {this.props.children}
                </AreaChart>
            </ResponsiveContainer>
        );
    }
}

export default Timeline;