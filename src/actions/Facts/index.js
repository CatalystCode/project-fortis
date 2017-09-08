/*import { SERVICES } from '../../services/Admin';
import parallelAsync from 'async/parallel';
import constants from '../constants';
import { momentLastMonths } from '../../utils/Utils.js';

const methods = {
    load_facts(siteKey, limit, offset, filteredEdges = [], dataSources = [], fromDate="", toDate="", fulltextTerm="", langCode="en") {
        let self = this;
        let originalSource;
        if (dataSources.length === 0) dataSources = ["tadaweb"];
        let sourceProperties = ["title", "link", "originalSources"];
        if (!fromDate || !toDate) {
            let range = momentLastMonths(3);
            fromDate = range.fromDate;
            toDate = range.toDate;
        }

        SERVICES.FetchMessages(siteKey, originalSource, filteredEdges, langCode, limit, offset, fromDate, toDate, dataSources, fulltextTerm, sourceProperties, (err, reqRsp, body) => ResponseHandler(err, reqRsp, body, (error, response) => {
            if (response && !error) {
                self.dispatch(constants.FACTS.LOAD_FACTS_SUCCESS, { response });
            } else {
                console.warn('Error, could not load facts', error);
                self.dispatch(constants.FACTS.LOAD_FACTS_FAIL, { error });
            }
        }));
    },
    load_tags(siteKey, sourceFilter=[], fromDate="", toDate="", query=""){
        let self = this;
        SERVICES.FetchTerms(siteKey, query, fromDate, toDate, sourceFilter, (err, response, body) => ResponseHandler(err, response, body, (error, response) => {
            if (response && !error) {
                self.dispatch(constants.FACTS.LOAD_TAGS, response);
            } else {
                console.error(`[${error}] occured while processing tag request`);
            }
        }));
    },
    load_settings(siteName){
        let self = this;
        SERVICES.getSiteDefintion(siteName, (err, response, body) => ResponseHandler(err, response, body, (error, graphqlResponse) => {
            console.log(constants.FACTS.INITIALIZE);
            if (graphqlResponse && !error) {
                self.dispatch(constants.FACTS.INITIALIZE, graphqlResponse.siteDefinition.sites[0]);
            }else{
                console.error(`[${error}] occured while processing message request`);
            }
        }));
    },
    save_page_state(pageState) {
        this.dispatch(constants.FACTS.SAVE_PAGE_STATE, pageState);
    },
    changeLanguage(language){
       this.dispatch(constants.FACTS.CHANGE_LANGUAGE, language);
    }
};

module.exports = {
    constants: constants,
    methods: {FACTS: methods}
};
*/