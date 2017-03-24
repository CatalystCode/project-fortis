import React, { Component } from 'react';
import { PieChart, Pie, Sector, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import numeralLibs from 'numeral';

const CustomTooltip  = React.createClass({
  render() {
    const { active } = this.props;

    if (active) {
      const { payload } = this.props;
      const valueText = numeralLibs(payload[0].value).format(payload[0].value > 1000 ? '+0.0a' : '0a')
      return (
        <div className="custom-tooltip">
          <p className="label">{payload[0].icon ? payload[0].icon : ''}&nbsp;{payload[0].name}</p>
          <p className="desc">{valueText} mentions</p>
        </div>
      );
    }

    return null;
  }
});

export default class DoughnutChart extends Component {
    renderActiveShape(props, activeIndex){

        if(activeIndex < 0){
            return;
        }

        const RADIAN = Math.PI / 180;
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, value } = props;

        let c = {};
        c.midAngle = 54.11764705882353;
        c.sin = Math.sin(-RADIAN * c.midAngle);
        c.cos = Math.cos(-RADIAN * c.midAngle);
        c.cx = cx;
        c.cy = cy;
        c.sx = cx + (outerRadius + 10) * c.cos; 
        c.sy = cy + (outerRadius + 10) * c.sin; 
        c.mx = cx + (outerRadius + 30) * c.cos; 
        c.my = cy + (outerRadius + 30) * c.sin; 
        c.ex = c.mx + (c.cos >= 0 ? 1 : -1) * 22; 
        c.ey = c.my; 
        c.textAnchor = 'start'
        const valueText = numeralLibs(value).format(value > 1000 ? '+0.0a' : '0a')

        return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
            <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            />
            <Sector
            cx={c.cx}
            cy={c.cy}
            startAngle={300}
            endAngle={60}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
            />
            <path d={`M${c.sx},${c.sy}L${c.mx},${c.my}L${c.ex},${c.ey}`} stroke={fill} fill="none"/>
            <circle cx={c.ex} cy={c.ey} r={2} fill={fill} stroke="none"/>
            <text x={c.ex + (c.cos >= 0 ? 1 : -1) * 12} y={c.ey} textAnchor={c.textAnchor} fill="#fff">{`${valueText} mentions`}</text>
        </g>
        );
  }

  shouldComponentUpdate(nextProps, nextState){
      if(nextProps.data && nextProps.data.length > 0 && this.props.data){
          let previousValueSum = this.props.data.reduce((acc, cur) => acc + cur.value, 0);
          let nextValueSum = nextProps.data.reduce((acc, cur) => acc + cur.value, 0);

          return nextProps.activeIndex !== this.props.activeIndex || previousValueSum !== nextValueSum || nextProps.language !== this.props.language;
      }else{
          return true;
      }
  }

  render() {  
    if (this.props.data.length === 0) {
        return null;
    }

    return (
       <ResponsiveContainer debounce={1000}>
          <PieChart margin={{top: -50, right: 0, left: 0, bottom: 0}}>
               <Pie cx="35%" cy="50%"
                    innerRadius={60} 
                    onClick={this.props.handleClick}
                    outerRadius={'70%'} 
                    fill={this.props.fill}
                    activeIndex={this.props.activeIndex}
                    data={this.props.data}
                    activeShape={props=>this.renderActiveShape(props, this.props.activeIndex)} 
                    paddingAngle={0}>
              {this.props.children}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ marginLeft: 2, width: '40%' }} layout="vertical" align="right"/>
          </PieChart>
       </ResponsiveContainer>
    );
  }
}