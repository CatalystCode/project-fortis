import { Route } from 'react-router'
import { AppPage } from './AppPage';
import { DashboardPage } from './DashboardPage';
import { FactsPage } from './FactsPage';
import { AdminPage } from './AdminPage';
import { NotFoundPage } from './NotFoundPage';
import React from 'react';
import BrowserDetection from 'react-browser-detection';

class AppPageWithBrowserDetection extends React.Component {
  render() {
    const browserConfigs = {
      chrome: () => <AppPage {...this.props} />,
      firefox: () => <AppPage {...this.props} />,
      default: () => (
        <div className="loadingPage">
          <h1>Your browser is not supported. Please try using Chrome or Firefox</h1>
        </div>
      )
    };

    return (
      <BrowserDetection>
        { browserConfigs }
      </BrowserDetection>
    );
  }
}

export const routes = (
  <Route path="/" component={AppPageWithBrowserDetection} linkLabel="My App" icon="fa fa-share-alt-square fa">
    <Route path="site/:category(/share/:sharedViewState)" component={DashboardPage} />
    <Route path="site/:category/facts" component={FactsPage} />
    <Route path="site/:category/admin" component={AdminPage} />
    <Route path="*" component={NotFoundPage} />
  </Route>
);

export function changeCategory(category) {
  window.location = `#/site/${category}`;
  window.location.reload();
}
