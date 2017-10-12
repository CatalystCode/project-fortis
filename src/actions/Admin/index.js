import { SERVICES as AdminServices } from '../../services/Admin';
import { ResponseHandler } from '../shared';
import constants from '../constants';
import differenceBy from 'lodash/differenceBy';

function getListAfterRemove(listBeforeRemove, itemsRemoved, keyBy) {
  return differenceBy(listBeforeRemove, itemsRemoved, keyBy);
}

const methods = {
  load_blacklist() {
    const self = this;
    AdminServices.fetchBlacklists((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        self.dispatch(constants.ADMIN.LOAD_BLACKLIST, { response: graphqlResponse.termBlacklist.filters });
      } else {
        const action = 'failed';
        console.error(`[${error}] occured while loading blacklist.`);
        self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
      }
    }));
  },

  save_blacklist(termFilters) {
    const self = this;
    AdminServices.saveBlacklists(termFilters, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      let action = false;

      if (graphqlResponse && !error) {
        action = "saved";
        const blacklistAfterSave = this.flux.stores.AdminStore.dataStore.blacklist;
        self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action, response: blacklistAfterSave});
      } else{
        action = 'failed';
        console.error(`[${error}] occured while processing blacklist request.`);
        self.dispatch(constants.ADMIN.LOAD_FAIL, {action});
      }
    }));
  },

  remove_blacklist(termFilters) {
    const self = this;
    AdminServices.removeBlacklists(termFilters, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      let action = false;

      if (graphqlResponse && !error) {
        action = "saved";
        const blacklistBeforeRemove = this.flux.stores.AdminStore.dataStore.blacklist;
        const blacklistRemoved = graphqlResponse.removeBlacklist.filters;
        const blacklistAfterRemove = getListAfterRemove(blacklistBeforeRemove, blacklistRemoved, 'id');
        self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action, response: blacklistAfterRemove});
      } else {
        action = 'failed';
        console.error(`[${error}] occured while processing blacklist request`);
        self.dispatch(constants.ADMIN.LOAD_FAIL, {action});
      }
    }));
  },

    load_streams() {
      const self = this;
      const dataStore = this.flux.stores.AdminStore.dataStore;

      if (!dataStore.loading) {
        AdminServices.fetchStreams((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
          if (graphqlResponse) {
            let response = graphqlResponse ? graphqlResponse.streams.streams : [];
            response.forEach(stream => {
              stream.params = JSON.stringify(stream.params)
            });
            const action = false;
            self.dispatch(constants.ADMIN.LOAD_STREAMS, {response, action});
          } else {
            const error = 'Error, could not load streams for admin page';
            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
          }
        }))
      }
    },

    save_streams(streams) {
      const self = this;
      AdminServices.saveStreams(streams, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse) {
          const action = "saved";
          const streamsAfterSave = this.flux.stores.AdminStore.dataStore.streams;
          self.dispatch(constants.ADMIN.LOAD_STREAMS, { action, response: streamsAfterSave });
        } else {
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error: `[${error}]: Error, could not load streams for admin page.` });
        }
      }));
    },

    remove_streams(streams) {
      const self = this;
      const dataStore = this.flux.stores.AdminStore.dataStore;

      if (!dataStore.loading) {
        AdminServices.removeStreams(streams, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
          if (graphqlResponse) {
            const response = graphqlResponse ? graphqlResponse : [];
            const action = false;
            self.dispatch(constants.ADMIN.REMOVE_STREAMS, {response, action});
          } else {
            const error = 'Error, could not remove streams for admin page';
            self.dispatch(constants.ADMIN.REMOVE_FAIL, { error });
          }
        }))
      }
    },

    load_settings() {
        const self = this;
        AdminServices.fetchSite((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            if (graphqlResponse && !error) {
                self.dispatch(constants.ADMIN.LOAD_SITE_SETTINGS, graphqlResponse.sites.site);
            } else {
                console.error(`[${error}] occured while processing message request`);
            }
        }));
    },

    changeLanguage(language) {
        this.dispatch(constants.APP.CHANGE_LANGUAGE, language);
    },

    save_settings(settings) {
      const self = this;

      AdminServices.editSite(settings, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const action = 'saved';
          self.dispatch(constants.ADMIN.SAVE_SITE_SETTINGS, {settings: settings, action: action});
        } else {
          console.error(`[${error}] occured while processing message request`);
        }
      }));
    },

    save_twitter_accounts(siteName, twitterAccts) {
        const self = this;
        const mutationNameTwitterAcctModify = "modifyTwitterAccounts";

        AdminServices.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModify, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                const action = 'saved';
                const streams = body.data.streams;
                self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCOUNTS, {streams, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
       });
    },

    remove_twitter_accounts(siteName, twitterAccts) {
        const self = this;
        const mutationNameTwitterAcctModifyRemove = "removeTwitterAccounts";
        AdminServices.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModifyRemove, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                const action = 'saved';
                const streams = body.data.streams;
                self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCOUNTS, {streams, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
       });
    },

    load_twitter_accounts() {
      const self = this;
      AdminServices.fetchTwitterAccounts((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const response = graphqlResponse ? graphqlResponse : [];
          const action = false;
          self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCOUNTS, {response, action});
        } else{
          const error = 'Error, could not load twitter accounts for admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }));
    },


  load_topics(translationLanguage) {
    const self = this;
    const dataStore = this.flux.stores.AdminStore.dataStore;
    if (!dataStore.loading) {
      AdminServices.fetchTopics(translationLanguage, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const response = graphqlResponse.siteTerms.edges ? graphqlResponse.siteTerms.edges : [];
          const action = "saved";
          self.dispatch(constants.ADMIN.LOAD_TOPICS, {response, action});
        } else {
          let error = 'Error, could not load keywords for admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }))
    }
  },

  save_topics(topics) {
    const self = this;
    AdminServices.saveTopics(topics, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const action = "saved";
        const topicsAfterSave = this.flux.stores.AdminStore.dataStore.watchlist;
        self.dispatch(constants.ADMIN.LOAD_TOPICS, { action, response: topicsAfterSave});
      } else {
        let error = 'Error, could not load keywords for admin page';
        self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
      }
    }));
  },

  remove_topics(topics) {
    const self = this;
    const dataStore = this.flux.stores.AdminStore.dataStore;
    if (!dataStore.loading) {
      AdminServices.removeTopics(topics, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const action = "saved";
          const topicsBeforeRemove = this.flux.stores.AdminStore.dataStore.watchlist;
          const topicsToRemove = graphqlResponse.removeKeywords.edges;
          const topicsAfterRemove = getListAfterRemove(topicsBeforeRemove, topicsToRemove, 'topicid');
          self.dispatch(constants.ADMIN.LOAD_TOPICS, { action, response: topicsAfterRemove });
        } else {
          let error = 'Error, could not remove keywords from admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }));
    }
  },

    load_trusted_sources(pipelineKeys, sourceName) {
      const self = this;
      const dataStore = this.flux.stores.AdminStore.dataStore;
      if (!dataStore.loading) {
        AdminServices.fetchTrustedSources(pipelineKeys, sourceName, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
          if (graphqlResponse && !error) {
            const response = graphqlResponse.trustedSources.sources
            const action = "saved";
            self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {response, action});
          } else {
            let error = 'Error, could not load trusted sources for admin page';
            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
          }
        }))
      }
    },

    save_trusted_sources(sources) {
      const self = this;
      const dataStore = this.flux.stores.AdminStore.dataStore;
      if (!dataStore.loading) {
        AdminServices.saveTrustedSources(sources, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
          if (graphqlResponse && !error) {
            const trustedSourcesAfterSave = this.flux.stores.AdminStore.dataStore.trustedSources;
            const action = 'saved';
            self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {response: trustedSourcesAfterSave, action});
          } else {
            let error = 'Error, could not load trusted sources for admin page';
            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
          }
        }))
      }
    },

    remove_trusted_sources(sources) {
      const self = this;
      const dataStore = this.flux.stores.AdminStore.dataStore;
      if (!dataStore.loading) {
        AdminServices.removeTrustedSources(sources, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
          if (graphqlResponse && !error) {
            const action = 'saved';
            const trustedSourcesBeforeRemove = this.flux.stores.AdminStore.dataStore.trustedSources;
            const trustedSourcesRemoved = graphqlResponse.removeTrustedSources.sources
            const trustedSourcesAfterRemove = getListAfterRemove(trustedSourcesBeforeRemove, trustedSourcesRemoved, 'rowKey');
            self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {response: trustedSourcesAfterRemove, action});
          } else {
            let error = 'Error, could not load trusted sources for admin page';
            self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
          }
        }))
      }
    },

    remove_keywords(siteId, deletedRows) {
        const self = this;

        AdminServices.removeKeywords(siteId, deletedRows, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data.removeKeywords) {
                const response = body.data.removeKeywords.edges;
                const action = 'saved';
                self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
        });
    },
    save_keywords(siteId, modifiedKeywords){
        const self = this;
        AdminServices.saveKeywords(siteId, modifiedKeywords, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                const action = 'saved';
                const response = body.data.addKeywords.edges;
                self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
        });
    },

    publish_events(events){
        AdminServices.publishCustomEvents(events, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = 'saved';
            const self = this;

            if (graphqlResponse && !error) {
                self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing message request`);
                self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
            }
        }));
    }
};

module.exports = {
    constants: constants,
    methods: {ADMIN: methods}
};