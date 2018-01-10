import React from 'react';
import FontIcon from 'material-ui/FontIcon';
import RaisedButton from 'material-ui/RaisedButton';

export class HeatmapToggle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false
    };
  }

  onClick = () => {
    this.props.onClick();
    this.setState({
      expanded: !this.state.expanded
    });
  }

  render() {
    const iconClassName = this.state.expanded ? 'fa fa-compress' : 'fa fa-expand';

    return (
      <div style={{paddingTop: '1em'}}>
        <RaisedButton
          label={this.props.text}
          icon={<FontIcon className={iconClassName} />}
          onClick={this.onClick} />
      </div>
    );
  }
}
