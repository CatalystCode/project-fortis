import { Route } from 'react-router'
import {AppPage} from './AppPage';
import {EntryPage} from './EntryPage';
import {FactsPage} from './FactsPage';
import {PredictionsPage} from './PredictionsPage';
import {AdminPage} from './AdminPage';
import {NotFoundPage} from './NotFoundPage';
import React from 'react';

export const routes = (
    <Route path="/" component={AppPage} linkLabel="My App" icon="fa fa-share-alt-square fa">
        <Route path="site/:siteKey" component={EntryPage} />
        <Route path="site/:siteKey/facts" component={FactsPage} />
        <Route path="site/:siteKey/predictions" component={PredictionsPage} />
        <Route path="site/:siteKey/admin" component={AdminPage} />
        <Route path="*" component={NotFoundPage} />
    </Route>
);
