import * as AdminFragments from '../graphql/fragments/Admin';
import * as AdminQueries from '../graphql/queries/Admin';
import * as AdminMutations from '../graphql/mutations/Admin';
import { fetchGqlData } from '../shared';
import request from 'request';

const SETTINGS_ENDPOINT = 'settings';
const MESSAGES_ENDPOINT = 'messages';

export const SERVICES = {
  restartPipeline(callback) {
    const query = `${AdminMutations.restartPipeline}`;
    fetchGqlData(MESSAGES_ENDPOINT, { query }, callback);
  },

    getDashboardSiteDefinition(translationLanguage, category, callback) {
        const query = ` ${AdminFragments.siteSettingsFragment}
                      ${AdminQueries.getPipelineDefinition}`;

        const variables = { translationLanguage, category };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    fetchSite(callback) {
        const query = `${AdminFragments.site}${AdminQueries.getSite}`;
        const variables = {};
        fetchGqlData(SETTINGS_ENDPOINT, { variables, query }, callback);
    },

    getWatchlist(translationLanguage, category, callback) {
        const query = ` ${AdminQueries.getPipelineWatchlist}`;

        const variables = { translationLanguage, category };
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
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
        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/messages`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    saveKeywords(site, edges, callback) {
        const query = `${""}//termsEdgeFragment}
                        mutation AddKeywords($input: EdgeTerms!) {
                            addKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },
    editSite(site, callback) {
        const query = `mutation EditSite($input: EditableSiteSettings!) {
          editSite(input: $input) {
            name
          }
        }`;

        const variables = { input: site };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },

    removeKeywords(site, edges, callback) {
        const query = `${""}//termsEdgeFragment}
                        mutation RemoveKeywords($input: EdgeTerms!) {
                            removeKeywords(input: $input) {
                                ...FortisDashboardTermEdges
                            }
                        }`;

        const variables = { input: { site, edges } };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/edges`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    }
};