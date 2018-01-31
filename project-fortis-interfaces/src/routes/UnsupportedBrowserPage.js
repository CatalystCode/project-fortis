import React from 'react';

export default class UnsupportedBrowserPage extends React.Component {
  render() {
    return (
      <div className="loadingPage">
        <h1>Your browser is not supported. Please try using Chrome or Firefox</h1>
      </div>
    );
  }
};
