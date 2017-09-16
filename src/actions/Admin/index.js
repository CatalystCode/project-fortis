import { SERVICES as AdminServices } from '../../services/Admin';
import { ResponseHandler } from '../shared';
import constants from '../constants';
import unionBy from 'lodash/unionBy';
import differenceBy from 'lodash/differenceBy';

function getBlacklistAfterRemove(blacklistBeforeRemove, blacklistRemoved) {
  return differenceBy(blacklistBeforeRemove, blacklistRemoved, 'id');
}

/*
function getBlacklistAfterSave(blacklistBeforeSave, blacklistSaved) {
  const difference = differenceBy(blacklistBeforeSave, blacklistSaved, 'id');
  return unionBy(difference, blacklistSaved, 'id');
}
*/

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
        const blacklistAfterRemove = getBlacklistAfterRemove(blacklistBeforeRemove, blacklistRemoved);
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
            const response = graphqlResponse ? graphqlResponse : [];
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
          const response = graphqlResponse ? graphqlResponse : [];
          const action = false;
          self.dispatch(constants.ADMIN.MODIFY_STREAMS, {response, action});
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
            const action = false;
            self.dispatch(constants.ADMIN.LOAD_TOPICS, {response, action});
          } else {
            let error = 'Error, could not load keywords for admin page';
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
    save_keywords: function(siteId, modifiedKeywords){
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

    publish_events: function(events){
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
    },

    load_fb_pages: function(siteId) {
        const self = this;
        const days = 30;

        AdminServices.getAdminFbPages(siteId, days, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = false;
            if (graphqlResponse && !error) {
                const { pages, analytics } = graphqlResponse;

                pages.pages.forEach(page => {
                    for(var i = 0;i < analytics.analytics.length; i++) {
                        if (page.pageUrl === analytics.analytics[i].Name) {
                            page.Count = analytics.analytics[i].Count;
                            page.LastUpdated = analytics.analytics[i].LastUpdated;
                            break;
                        }
                        page.Count = 0;
                    }
                });

                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing FB pages request`);
                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
            }
        }));
    },
    load_trusted_twitter_accts: function(siteId) {
        const self = this;

        AdminServices.getTrustedTwitterAccounts(siteId, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = false;
            if (graphqlResponse && !error) {
                const { accounts } = graphqlResponse;
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing Trusted Twitter Accounts request`);
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
            }
        }));
    },
    load_places_inside_bbox: function(siteId, bbox) {
        const self = this;

        AdminServices.getPlacesByBBox(siteId, bbox, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = false;
            if (graphqlResponse && !error) {
                const { features } = graphqlResponse;
                self.dispatch(constants.ADMIN.LOAD_PLACES, {action, features});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing FB pages request`);
                self.dispatch(constants.ADMIN.LOAD_PLACES, {action});
            }
        }));
    },
    remove_fb_pages: function(siteId, pages){
        const self = this;
        AdminServices.removeFbPages(siteId, pages, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { pages } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing FB pages request`);
                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
            }
        }));
    },

    remove_trusted_twitter_accts: function(siteId, accounts){
        const self = this;
        AdminServices.removeTrustedTwitterAccts(siteId, accounts, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { accounts } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing Trusted Twitter Accounts request`);
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
            }
        }));
    },

    save_fb_pages: function(siteId, pages){
        const self = this;

        // Only add the RowKey and pageUrl in the Azure Table Storage
        let filteredInput = [];
        pages.forEach(page => {
            let filteredPage = {};
            filteredPage.RowKey = page.RowKey;
            filteredPage.pageUrl = page.pageUrl;
            filteredInput.push(filteredPage);
        });

        AdminServices.saveFbPages(siteId, filteredInput, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { pages } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action, pages});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing FB pages request`);
                self.dispatch(constants.ADMIN.LOAD_FB_PAGES, {action});
            }
        }));
    },

    save_trusted_twitter_accts: function(siteId, accounts){
        const self = this;
        AdminServices.saveTrustedTwitterAccts(siteId, accounts, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { accounts } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action, accounts});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing Trusted Twitter Accounts request`);
                self.dispatch(constants.ADMIN.LOAD_TRUSTED_TWITTER_ACCTS, {action});
            }
        }));
    }
};

module.exports = {
    constants: constants,
    methods: {ADMIN: methods}
};