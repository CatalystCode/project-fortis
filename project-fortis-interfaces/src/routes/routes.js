import React from 'react';
import { Route } from 'react-router'
import { AppPage } from './AppPage';
import { DashboardPage } from './DashboardPage';
import { FactsPage } from './FactsPage';
import { AdminPage } from './AdminPage';
import { NotFoundPage } from './NotFoundPage';

export const routes = (
  <Route path="/" component={AppPage} linkLabel="My App" icon="fa fa-share-alt-square fa">
    <Route path="share/:sharedViewState" component={DashboardPage} />
    <Route path="dashboard(/:category)" component={DashboardPage} />
    <Route path="facts(/:category)" component={FactsPage} />
    <Route path="settings(/:category)" component={AdminPage} />
    <Route path="*" component={NotFoundPage} />
  </Route>
);

export function changeCategory(category) {
  window.location = category ? `#/dashboard/${category}` : '#/dashboard';
  window.location.reload();
}
