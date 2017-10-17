import * as FactsFragments from '../graphql/fragments/Facts';
import * as FactsQueries from '../graphql/queries/Facts';
import { fetchGqlData } from '../shared';

export const SERVICES = {
  loadFacts(pipelinekeys, callback) {
    const gqlEndpoint = 'messages';

    const selectionFragments = `
      ${FactsFragments.factsFragment}
    `;

    const query = `
      ${selectionFragments}
      ${FactsQueries.FactsQuery}
    `;

    const variables = {
      pipelinekeys
    };

    fetchGqlData(gqlEndpoint, { variables, query }, callback);
  },
}