import * as AdminFragments from '../graphql/fragments/Admin';
import * as AdminQueries from '../graphql/queries/Admin';
import * as AdminMutations from '../graphql/mutations/Admin';
import { fetchGqlData, SETTINGS_ENDPOINT, EDGES_ENDPOINT, MESSAGES_ENDPOINT } from '../shared';

export const SERVICES = {
    restartPipeline(callback) {
      const query = `${AdminMutations.restartPipeline}`;
      const variables = {};
      fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
    },

    fetchUsers(callback) {
      const query = `${AdminFragments.users}${AdminQueries.getUsers}`;
      const variables = {};
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    addUsers(users, callback) {
      const query = `${AdminFragments.users}${AdminMutations.addUsers}`;
      const variables = { input: { users } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    removeUsers(users, callback) {
      const query = `${AdminFragments.users}${AdminMutations.removeUsers}`;
      const variables = { input: { users } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    getDashboardSiteDefinition(translationLanguage, category, callback) {
        const query = `${AdminFragments.siteSettingsFragment}
                      ${AdminQueries.getPipelineDefinition}`;
        const variables = { translationLanguage, category };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    fetchSite(callback) {
        const query = `${AdminFragments.site}${AdminQueries.getSite}`;
        const variables = {};
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    getWatchlist(translationLanguage, category, callback) {
        const query = ` ${AdminQueries.getPipelineWatchlist}`;
        const variables = { translationLanguage, category };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    fetchTopics(translationLanguage, callback) {
      const query = `${AdminFragments.topics}${AdminQueries.getTopics}`;
      const variables = { translationLanguage };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    saveTopics(topics, callback) {
      const query = `${AdminFragments.topics}${AdminMutations.saveTopics}`;
      const variables = { input: { edges: topics } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    removeTopics(topics, callback) {
      const query = `${AdminFragments.topics}${AdminMutations.removeTopics}`;
      const variables = { input: { edges: topics } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    fetchBlacklists(callback) {
        const query = `${AdminFragments.blacklist}${AdminQueries.getBlacklists}`;
        const variables = {};
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    saveBlacklists(blacklist, callback) {
        const query = `${AdminFragments.blacklist}${AdminMutations.saveBlacklists}`;
        const variables = { input: { filters: blacklist } };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    removeBlacklists(blacklist, callback) {
        const query = `${AdminFragments.blacklist}${AdminMutations.removeBlacklists}`;
        const variables = { input: { filters: blacklist } };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    fetchTrustedSources(callback) {
      const query = `${AdminFragments.trustedsources}${AdminQueries.getTrustedSources}`;
      const variables = {};
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    saveTrustedSources(sources, callback) {
      const query = `${AdminFragments.trustedsources}${AdminMutations.saveTrustedSources}`;
      const variables = { input: { sources } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    removeTrustedSources(sources, callback) {
      const query = `${AdminFragments.trustedsources}${AdminMutations.removeTrustedSources}`;
      const variables = { input: { sources } };
      fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    fetchStreams(callback) {
        const query = `${AdminFragments.streams}${AdminQueries.getStreams}`;
        const variables = {};
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    saveStreams(streams, callback) {
        const query = `${AdminFragments.streams}${AdminMutations.saveStreams}`;
        const variables = { input: { streams } };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    publishCustomEvents(messages, callback) {
        const query = ` mutation PublishEvents($input: NewMessages!) {
                            events: publishEvents(input: $input)
                        }`;
        const variables = { input: { messages } };
        fetchGqlData(MESSAGES_ENDPOINT, { variables, query }, callback);
    },

    saveKeywords(site, edges, callback) {
        const query = `${""}//termsEdgeFragment}
                        mutation AddKeywords($input: EdgeTerms!) {
                            addKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;
        const variables = { input: { site, edges } };
        fetchGqlData(EDGES_ENDPOINT, { variables, query }, callback);
    },

    editSite(site, callback) {
        const query = `mutation EditSite($input: EditableSiteSettings!) {
          editSite(input: $input) {
            name
          }
        }`;
        const variables = { input: site };
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    removeKeywords(site, edges, callback) {
        const query = `${""}//termsEdgeFragment}
                        mutation RemoveKeywords($input: EdgeTerms!) {
                            removeKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;
        const variables = { input: { site, edges } };
        fetchGqlData(EDGES_ENDPOINT, { variables, query }, callback);
    }
};