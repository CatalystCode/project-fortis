import React, { Component } from 'react';
import { ResponsiveContainer } from 'recharts';
import { TagCloud } from "react-tagcloud";

const style = {
  display: 'table'
};

/**
 * Render the cloud using D3. Not stateless, because async rendering of d3-cloud
 */
export default class WordCloud extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cloudDimensions: []
    };
  }

  render() {
    const { words, minSize, maxSize, customRenderer, onClick } = this.props;

    return (
      <ResponsiveContainer debounce={1000}>
        <TagCloud tags={words}
          minSize={minSize}
          style={style}
          maxSize={maxSize}
          renderer={customRenderer}
          onClick={onClick} />
      </ResponsiveContainer>
    );
  }
}