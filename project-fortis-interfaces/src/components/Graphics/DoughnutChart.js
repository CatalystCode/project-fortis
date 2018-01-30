import React, { Component } from 'react';
import { PieChart, Pie, Sector, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import numeralLibs from 'numeral';

class CustomTooltip extends Component {
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
}

export default class DoughnutChart extends Component {
    renderActiveShape = (props) => {
      const RADIAN = Math.PI / 180;
      const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, value } = props;
      const sin = Math.sin(-RADIAN * midAngle);
      const cos = Math.cos(-RADIAN * midAngle);
      const sx = cx + (outerRadius + 10) * cos;
      const sy = cy + (outerRadius + 10) * sin;
      const mx = cx + (outerRadius + 30) * cos;
      const my = cy + (outerRadius + 30) * sin;
      const ex = mx + (cos >= 0 ? 1 : -1) * 22;
      const ey = my;
      const textAnchor = cos >= 0 ? 'start' : 'end';
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
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
          />
          <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
          <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
          <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${valueText}`}</text>
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
                    activeShape={this.renderActiveShape}
                    isAnimationActive={false}
                    paddingAngle={0}
                    {...this.props}>
              {this.props.children}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ marginLeft: 2, width: '40%' }} layout="vertical" align="right"/>
          </PieChart>
       </ResponsiveContainer>
    );
  }
}