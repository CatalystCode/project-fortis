import * as AdminFragments from '../graphql/fragments/Admin';
import * as AdminQueries from '../graphql/queries/Admin';
import * as AdminMutations from '../graphql/mutations/Admin';
import { fetchGqlData } from '../shared';
import request from 'request';

const SETTINGS_ENDPOINT = 'settings';

const trustedTwitterFragment = `fragment FortisTrustedTwitterAcctView on TrustedTwitterAccountCollection {
                            accounts {
                                    RowKey
                                    acctUrl
                            }
                        }`;

const fbPageAnalyticsFragment = `fragment FortisAdminSettingsView on FacebookPageAnalyticsCollection {
                        analytics {
                            Name,
                            Count,
                            LastUpdated
                        }
                      }`;

const fbPageFragment = `fragment FortisDashboardView on FacebookPageCollection {
                        runTime
                        pages {
                            RowKey
                            pageUrl
                        }
                      }`;

export const SERVICES = {
    getDashboardSiteDefinition(translationLanguage, callback) {
        const query = ` ${AdminFragments.siteSettingsFragment}
                      ${AdminQueries.getPipelineDefinition}`;

        const variables = { translationLanguage };
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

    getWatchlist(translationLanguage, callback) {
        const query = ` ${AdminQueries.getPipelineWatchlist}`;

        const variables = { translationLanguage };
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

    fetchTwitterAccounts(callback) {
        const query = `${AdminFragments.twitterAccounts}${AdminQueries.getTwitterAccounts}`;
        const variables = {};
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

    getTrustedTwitterAccounts(siteId, callback) {
        let query = `  ${trustedTwitterFragment}
                        query TrustedTwitterAccounts($siteId: String!) {
                            accounts: trustedTwitterAccounts(siteId: $siteId) {
                                ...FortisTrustedTwitterAcctView
                            }
                        }`;

        let variables = { siteId };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
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

    saveLocations(site, edges, callback) {
        const query = `${""}//locationEdgeFragment}
                        mutation SaveLocations($input: EdgeLocations!) {
                            saveLocations(input: $input) {
                                ...FortisDashboardLocationEdges
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

    removeLocations(site, edges, callback) {
        const query = `${""}//locationEdgeFragment}
                        mutation removeLocations($input: EdgeLocations!) {
                            removeLocations(input: $input) {
                                ...FortisDashboardLocationEdges
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
    },
    getAdminFbPages(siteId, days, callback) {
        let query = ` ${fbPageFragment},
                      ${fbPageAnalyticsFragment}
                           query FacebookPages($siteId: String!, $days: Int!) {
                              pages: facebookPages(siteId: $siteId) {
                                  ...FortisDashboardView
                              },
                              analytics: facebookAnalytics(siteId: $siteId, days: $days)
                              {
                                  ...FortisAdminSettingsView
                              }
                          }`;

        let variables = { siteId, days };

        let host = process.env.REACT_APP_SERVICE_HOST
        var POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    },
    saveFbPages(site, pages, callback) {
        const query = `${fbPageFragment}
                          mutation ModifyFacebookPages($input: FacebookPageListInput!) {
                              pages: modifyFacebookPages(input: $input) {
                                  ...FortisDashboardView
                              }
                          }`;

        const variables = { input: { pages, site } };

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
    saveTrustedTwitterAccts(site, accounts, callback) {
        const query = `${trustedTwitterFragment}
                          mutation ModifyTrustedTwitterAccounts($input: TrustedTwitterAccountDefintion!) {
                              accounts: modifyTrustedTwitterAccounts(input: $input) {
                                  ...FortisTrustedTwitterAcctView
                              }
                          }`;

        const variables = { input: { accounts, site } };

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
    removeFbPages(site, pages, callback) {
        const query = `${fbPageFragment}
                          mutation RemoveFacebookPages($input: FacebookPageListInput!) {
                              pages: removeFacebookPages(input: $input) {
                                  ...FortisDashboardView
                              }
                          }`;

        const variables = { input: { pages, site } };

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
    removeTrustedTwitterAccts(site, accounts, callback) {
        const query = `${trustedTwitterFragment}
                          mutation RemoveTrustedTwitterAccounts($input: TrustedTwitterAccountDefintion!) {
                              accounts: removeTrustedTwitterAccounts(input: $input) {
                                  ...FortisTrustedTwitterAcctView
                              }
                          }`;

        const variables = { input: { accounts, site } };

        const host = process.env.REACT_APP_SERVICE_HOST
        const POST = {
            url: `${host}/api/settings`,
            method: "POST",
            json: true,
            withCredentials: false,
            body: { query, variables }
        };

        request(POST, callback);
    }
};