import { SERVICES as AdminServices } from '../../services/Admin';
import { ResponseHandler } from '../shared';
import parallelAsync from 'async/parallel';
import constants from '../constants';

const methods = {
    load_streams () {
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

    save_streams (streams) {
      let self = this;
      AdminServices.saveStreams(streams, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse) {
          const response = graphqlResponse ? graphqlResponse : [];
          const action = false;
          self.dispatch(constants.ADMIN.MODIFY_STREAMS, {response, action});
        } else {
          const error = `[${error}]: Error, could not load streams for admin page.`;
          self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
        }
      }));
    },

    remove_streams (streams) {
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

    load_settings () {
        let self = this;
        AdminServices.getSiteDefinition((err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            if (graphqlResponse && !error) {
                self.dispatch(constants.ADMIN.LOAD_SITE_SETTINGS, graphqlResponse.sites.site);
            } else {
                console.error(`[${error}] occured while processing message request`);
            }
        }));
    },

    changeLanguage (language) {
        this.dispatch(constants.APP.CHANGE_LANGUAGE, language);
    },

    save_settings (settings) {
      let self = this;

      AdminServices.editSite(settings, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
        if (graphqlResponse && !error) {
          const action = 'saved';
          self.dispatch(constants.ADMIN.SAVE_SITE_SETTINGS, {settings: settings, action: action});
        } else {
          console.error(`[${error}] occured while processing message request`);
        }
      }));
    },

    save_twitter_accts (siteName, twitterAccts) {
        let self = this;
        const mutationNameTwitterAcctModify = "modifyTwitterAccounts";

        AdminServices.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModify, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                const action = 'saved';
                const streams = body.data.streams;
                self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
       });
    },

    remove_twitter_accts (siteName, twitterAccts) {
        let self = this;
        const mutationNameTwitterAcctModifyRemove = "removeTwitterAccounts";
        AdminServices.saveTwitterAccounts(siteName, twitterAccts, mutationNameTwitterAcctModifyRemove, (error, response, body) => {
            if(!error && response.statusCode === 200 && body.data && body.data.streams) {
                const action = 'saved';
                const streams = body.data.streams;
                self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
       });
    },

    load_twitter_accts (siteId) {
        let self = this;
        AdminServices.getTwitterAccounts(siteId, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        const streams = body.data.streams;
                        let action = false;
                        self.dispatch(constants.ADMIN.LOAD_TWITTER_ACCTS, {streams, action});
                    }else{
                        let error = 'Error, could not load twitter accts for admin page';
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                    }
        });
    },
    load_keywords (siteId) {
        let self = this;
        const edgeType = "Term";
        let dataStore = this.flux.stores.AdminStore.dataStore;
        if (!dataStore.loading) {
            AdminServices.fetchEdges(siteId, edgeType, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        let response = body.data.terms ? body.data.terms.edges : [];

                        let action = false;
                        self.dispatch(constants.ADMIN.LOAD_KEYWORDS, {response, action});
                    }else{
                        let error = 'Error, could not load keywords for admin page';
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                    }
            })
        }
    },
    remove_keywords (siteId, deletedRows) {
        let self = this;

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
        let self = this;
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
    save_locations: function(siteId, modifiedLocations, mutatedSiteDefintion){
        parallelAsync({
            settings: callback => {
                AdminServices.createOrReplaceSite(siteId, mutatedSiteDefintion, (error, response, body) => ResponseHandler(error, response, body, callback))
            },
            locations: callback => {
                AdminServices.saveLocations(siteId, modifiedLocations, (error, response, body) => ResponseHandler(error, response, body, callback))
            }
        }, (error, results) => {
                if(!error && Object.keys(results).length === 2
                          && results.settings.createOrReplaceSite.name){
                    const action = 'saved';
                    const response = results.locations.saveLocations.edges;
                    this.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action, mutatedSiteDefintion});
                }else {
                    console.error(`[${error}] occured while processing save locations request`);
                }
        });
    },
    publish_events: function(events){
        AdminServices.publishCustomEvents(events, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = 'saved';
            let self = this;

            if (graphqlResponse && !error) {
                self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing message request`);
                self.dispatch(constants.ADMIN.PUBLISHED_EVENTS, {action});
            }
        }));
    },
    remove_locations: function(siteId, modifiedLocations){
        let self = this;
        AdminServices.removeLocations(siteId, modifiedLocations, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                const action = 'saved';
                const response = body.data.removeLocations.edges;
                self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
            }else{
                console.error(`[${error}] occured while processing save locations request`);
            }
        });
    },
   load_localities: function (siteId) {
        let self = this;
        const edgeType = "Location";
        AdminServices.fetchEdges(siteId, edgeType, (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        const action = false;
                        const response = body.data.locations ? body.data.locations.edges : [];
                        self.dispatch(constants.ADMIN.LOAD_LOCALITIES, {response, action});
                    }else{
                        let error = 'Error, could not load keywords for admin page';
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error });
                    }
        });
    },

    load_fb_pages: function(siteId) {
        let self = this;
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
        let self = this;

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
        let self = this;

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
    load_blacklist: function(siteId) {
        let self = this;

        AdminServices.getBlacklistTerms(siteId, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            let action = false;
            if (graphqlResponse && !error) {
                const { filters } = graphqlResponse;
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action, filters});
            }else{
                action = 'failed';
                console.error(`[${error}] occured while processing FB pages request`);
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
            }
        }));
    },
    remove_blacklist: function(siteId, terms){
        let self = this;
        AdminServices.removeBlacklistTerms(siteId, terms, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { terms } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action:action, filters:terms});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing blacklist request`);
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
            }
        }));
    },
    save_blacklist: function(siteId, terms){
        let self = this;
        AdminServices.saveBlacklistTerms(siteId, terms, (error, response, body) => ResponseHandler(error, response, body, (gError, graphqlResponse) => {
            let action = false;

            if (graphqlResponse && !gError) {
                const { terms } = graphqlResponse;
                action = "saved";
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action:action, filters:terms});
            }else{
                action = 'failed';
                console.error(`[${gError}] occured while processing blacklist request`);
                self.dispatch(constants.ADMIN.LOAD_BLACKLIST, {action});
            }
        }));
    },
    remove_fb_pages: function(siteId, pages){
        let self = this;
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
        let self = this;
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
        let self = this;

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
        let self = this;
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