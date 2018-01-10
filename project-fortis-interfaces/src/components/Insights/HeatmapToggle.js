import React from 'react';

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
      <div>
        <button id="save-button" type="button" className="btn btn-primary btn-sm" onClick={this.onClick}>
          <span className={iconClassName} aria-hidden="true"></span>&nbsp;<span>{this.props.text}</span>
        </button>
      </div>
    );
  }
}
