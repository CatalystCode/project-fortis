import { SERVICES as AdminServices } from '../../services/Admin';
import { ResponseHandler } from '../shared';
import { doNothing } from '../../utils/Utils';
import constants from '../constants';
import differenceBy from 'lodash/differenceBy';

function getListAfterRemove(listBeforeRemove, itemsRemoved, keyBy) {
  return differenceBy(listBeforeRemove, itemsRemoved, keyBy);
}

function addIdsToUsersForGrid(users) {
  users.forEach(user => user.id = `${user.identifier}-${user.role}`);
}

function prepareBlacklistForGrid(rows) {
  rows.forEach(row => {
    if (row && row.filteredTerms && row.filteredTerms.constructor === Array) {
      row.filteredTerms = row.filteredTerms.join();
    }
  });
}

function stringValueToBoolean(rows) {
  rows.forEach(row => {
    row.isLocation = (row.isLocation === 'true');
  });
}

const _methods = {
  restart_pipeline() {
    const self = this;
    AdminServices.restartPipeline((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        self.dispatch(constants.ADMIN.RESTART_PIPELINE, { response: graphqlResponse.restartPipeline });
      } else {
        const action = 'failed';
        console.error(`Failed to restart pipeline`);
        self.dispatch(constants.ADMIN.RESTART_PIPELINE, {action});
      }
    }));
  },

  load_users() {
    const self = this;
    AdminServices.fetchUsers((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const users = graphqlResponse.users.users;
        addIdsToUsersForGrid(users);
        self.dispatch(constants.ADMIN.LOAD_USERS, { response: users });
      } else {
        console.error(`[${error}] occured while loading users.`);
        self.dispatch(constants.ADMIN.LOAD_FAIL, { action: 'failed' });
      }
    }));
  },

  add_users(users) {
    AdminServices.addUsers(users, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const usersBeforeSave = this.flux.stores.AdminStore.dataStore.users.filter(user => user.id === `${user.identifier}-${user.role}`);
        const usersAdded = graphqlResponse.addUsers.users;
        addIdsToUsersForGrid(usersAdded);
        const usersAfterSave = usersBeforeSave.concat(usersAdded).filter(user => user.identifier !== "" || user.role !== "");
        this.dispatch(constants.ADMIN.LOAD_USERS, {action: 'saved', response: usersAfterSave});
      } else {
        console.error(`[${error}] occured while processing user save request.`);
        this.dispatch(constants.ADMIN.LOAD_FAIL, {action: 'failed'});
      }
    }));
  },

  remove_users(users, callback) {
    callback = callback != null ? callback : doNothing;

    AdminServices.removeUsers(users, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const usersBeforeRemove = this.flux.stores.AdminStore.dataStore.users;
        const usersRemoved = graphqlResponse.removeUsers.users
        addIdsToUsersForGrid(usersRemoved);
        const usersAfterRemove = getListAfterRemove(usersBeforeRemove, usersRemoved, 'id').filter(user => user.identifier !== "" || user.role !== "");;
        this.dispatch(constants.ADMIN.LOAD_USERS, {action: 'saved', response: usersAfterRemove});
        callback(null, usersAfterRemove);
      } else {
        console.error(`[${error}] occured while processing user save request.`);
        this.dispatch(constants.ADMIN.LOAD_FAIL, {action: 'failed'});
        callback(error, null);
      }
    }));
  },

  load_blacklist() {
    AdminServices.fetchBlacklists((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const blacklist = graphqlResponse.termBlacklist.filters;
        prepareBlacklistForGrid(blacklist);
        this.dispatch(constants.ADMIN.LOAD_BLACKLIST, { response: blacklist });
      } else {
        console.error(`[${error}] occured while loading blacklist.`);
        this.dispatch(constants.ADMIN.LOAD_BLACKLIST, { action: 'failed' });
      }
    }));
  },

  save_blacklist(termFilters) {
    if (!termFilters && termFilters.length === 0) return;
    stringValueToBoolean(termFilters);
    AdminServices.saveBlacklists(termFilters, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const blacklistAfterSave = this.flux.stores.AdminStore.dataStore.blacklist;
        prepareBlacklistForGrid(blacklistAfterSave);
        this.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action: 'saved', response: blacklistAfterSave});
      } else {
        console.error(`[${error}] occured while processing blacklist request.`);
        this.dispatch(constants.ADMIN.LOAD_FAIL, { action: 'failed'});
      }
    }));
  },

  remove_blacklist(termFilters) {
    if (!termFilters && termFilters.length === 0) return;
    stringValueToBoolean(termFilters);
    AdminServices.removeBlacklists(termFilters, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
      if (graphqlResponse && !error) {
        const blacklistBeforeRemove = this.flux.stores.AdminStore.dataStore.blacklist;
        const blacklistRemoved = graphqlResponse.removeBlacklist.filters;
        const blacklistAfterRemove = getListAfterRemove(blacklistBeforeRemove, blacklistRemoved, 'id');
        this.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action: 'saved', response: blacklistAfterRemove});
      } else {
        console.error(`[${error}] occured while processing blacklist request`);
        this.dispatch(constants.ADMIN.LOAD_FAIL, { action: 'failed' });
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
          const error = 'Error, could not load keywords for admin page';
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
        const error = 'Error, could not load keywords for admin page';
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
          const error = 'Error, could not remove keywords from admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }));
    }
  },

  notifyDataGridTrustedSourcesLoaded() {
    const self = this;
    const action = "saved";
    self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {action});
  },

  save_trusted_sources(sources) {
    const self = this;
    const dataStore = this.flux.stores.DataStore.dataStore;
    if (!dataStore.loading) {
      AdminServices.saveTrustedSources(sources, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const trustedSourcesAfterSave = this.flux.stores.DataStore.dataStore.trustedSources;
          const action = 'saved';
          self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {action});
          self.dispatch(constants.DASHBOARD.LOAD_TRUSTED_SOURCES, {response: trustedSourcesAfterSave});
        } else {
          const error = 'Error, could not load trusted sources for admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }))
    }
  },

  remove_trusted_sources(sources) {
    const self = this;
    const dataStore = this.flux.stores.DataStore.dataStore;
    if (!dataStore.loading) {
      AdminServices.removeTrustedSources(sources, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const action = 'saved';
          const trustedSourcesBeforeRemove = this.flux.stores.DataStore.dataStore.trustedSources;
          const trustedSourcesRemoved = graphqlResponse.removeTrustedSources.sources
          const trustedSourcesAfterRemove = getListAfterRemove(trustedSourcesBeforeRemove, trustedSourcesRemoved, 'rowKey');
          self.dispatch(constants.ADMIN.LOAD_TRUSTED_SOURCES, {action});
          self.dispatch(constants.DASHBOARD.LOAD_TRUSTED_SOURCES, {response: trustedSourcesAfterRemove})
        } else {
          const error = 'Error, could not load trusted sources for admin page';
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }))
    }
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

const methods = { ADMIN: _methods };

module.exports = {
    constants,
    methods
};
