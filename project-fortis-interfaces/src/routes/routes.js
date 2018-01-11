import { Route } from 'react-router'
import { AppPage } from './AppPage';
import { DashboardPage } from './DashboardPage';
import { FactsPage } from './FactsPage';
import { AdminPage } from './AdminPage';
import { NotFoundPage } from './NotFoundPage';
import React from 'react';

export const routes = (
  <Route path="/" component={AppPage} linkLabel="My App" icon="fa fa-share-alt-square fa">
    <Route path="site/:siteKey(/share/:sharedViewState)" component={DashboardPage} />
    <Route path="site/:siteKey/facts" component={FactsPage} />
    <Route path="site/:siteKey/admin" component={AdminPage} />
    <Route path="*" component={NotFoundPage} />
  </Route>
);
