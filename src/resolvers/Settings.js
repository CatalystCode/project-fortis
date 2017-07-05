'use strict';

const Promise = require('promise');
const azureTableService = require('../clients/storage/AzureTableStorageManager');
const postgresMessageService = require('../clients/postgres/PostgresLocationManager');

function sites(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const siteId = args.siteId;
  return new Promise((resolve, reject) => {
    azureTableService.GetSiteDefinition(siteId, (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let siteCollection = Object.assign({}, {runTime: Date.now() - startTime, sites: results});
        resolve(siteCollection);
      }
    });
  });
}

function createOrReplaceSite(args, res) { // eslint-disable-line no-unused-vars
  const siteDefintion = args.input;
  return new Promise((resolve, reject) => {
    azureTableService.InsertOrReplaceSiteDefinition(siteDefintion, (error, result) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        resolve(result && result.length > 0 ? result[0] : {});
      }
    });
  });
}

function modifyFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const inputDefinition = args.input;
  const fbPages = inputDefinition.pages.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyFacebookPages(inputDefinition.site, fbPages, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY, 
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});
        resolve(acctCollection);
      }
    });
  });
}

function modifyTrustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const inputDefinition = args.input;
  console.log(inputDefinition);
  console.log('Modifying collection');
  const trustedAccts = inputDefinition.accounts.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));
  console.log(trustedAccts);
  return new Promise((resolve, reject) => {
    azureTableService.ModifyTrustedTwitterAccounts(inputDefinition.site, trustedAccts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(acctCollection);
      }
    });
  });
}

function removeFacebookPages(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const inputDefinition = args.input;
  const fbPages = inputDefinition.pages.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyFacebookPages(inputDefinition.site, fbPages, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});
        resolve(acctCollection);
      }
    }); 
  });
}

function removeTrustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const inputDefinition = args.input;
  const trustedAccts = inputDefinition.accounts.map(page => Object.assign({}, page, {PartitionKey: {'_': inputDefinition.site}, RowKey: {'_': page.RowKey}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyTrustedTwitterAccounts(inputDefinition.site, trustedAccts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(acctCollection);
      }
    });
  });
}

function modifyTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const twitterAccountDefintions = args.input;
  const twitterAccounts = twitterAccountDefintions.accounts.map(account => Object.assign({}, account, {PartitionKey: {'_': twitterAccountDefintions.site}, RowKey: {'_': account.accountName}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyTwitterAccounts(twitterAccountDefintions.site, twitterAccounts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(acctCollection);
      }
    });
  });
}

function removeTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const twitterAccountDefintions = args.input;
  const twitterAccounts = twitterAccountDefintions.accounts.map(account => Object.assign({}, account, {PartitionKey: {'_': twitterAccountDefintions.site}, RowKey: {'_': account.accountName}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyTwitterAccounts(twitterAccountDefintions.site, twitterAccounts, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(acctCollection);
      }
    });
  });
}

function twitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const siteId = args.siteId;
  return new Promise((resolve, reject) => {
    azureTableService.GetTwitterAccounts(siteId,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let acctCollection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(acctCollection);
      }
    });
  });
}

function trustedTwitterAccounts(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const siteId = args.siteId;
  return new Promise((resolve, reject) => {
    azureTableService.GetTrustedTwitterAccounts(siteId,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let collection = Object.assign({}, {runTime: Date.now() - startTime, accounts: results});
        resolve(collection);
      }
    });
  });
}

function facebookPages(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const siteId = args.siteId;
  return new Promise((resolve, reject) => {
    azureTableService.GetFacebookPages(siteId,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let collection = Object.assign({}, {runTime: Date.now() - startTime, pages: results});
        resolve(collection);
      }
    });
  });
}

function facebookAnalytics(args, res) { // eslint-disable-line no-unused-vars
  const days = args.days;
  const site = args.siteId;
  return new Promise((resolve, reject) => {
    postgresMessageService.FetchFacebookAnalytics(site,days,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal facebook analytics error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let collection = Object.assign({}, {analytics: results});
        resolve(collection);
      }
    });
  });
}

function termBlacklist(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const siteId = args.siteId;
  return new Promise((resolve, reject) => {
    azureTableService.GetBlacklistTerms(siteId,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        let collection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});
        resolve(collection);
      }
    });
  });
}

function modifyBlacklist(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const blacklistTermDefinitions = args.input;
  const blacklistTerms = blacklistTermDefinitions.terms.map(item => Object.assign({}, {PartitionKey: {'_': blacklistTermDefinitions.site}, RowKey: {'_': item.RowKey}, filteredTerms: JSON.stringify(item.filteredTerms), lang: item.lang}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyBlacklistTerms(blacklistTerms, blacklistTermDefinitions.site, azureTableService.AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY,
    (error, results) => {
      if (error) {
        const errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        const termCollection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});
        resolve(termCollection);
      }
    });
  });
}

function removeBlacklist(args, res) { // eslint-disable-line no-unused-vars
  const startTime = Date.now();
  const blacklistTermDefinitions = args.input;
  const blacklistTerms = blacklistTermDefinitions.terms.map(item => Object.assign({}, item, {PartitionKey: {'_': blacklistTermDefinitions.site}, RowKey: {'_': item.RowKey}}));
  return new Promise((resolve, reject) => {
    azureTableService.ModifyBlacklistTerms(blacklistTerms, blacklistTermDefinitions.site, azureTableService.AZURE_TABLE_BATCH_ACTIONS.DELETE,
    (error, results) => {
      if (error) {
        let errorMsg = `Internal location server error: [${JSON.stringify(error)}]`;
        reject(errorMsg);
      } else {
        const termCollection = Object.assign({}, {runTime: Date.now() - startTime, filters: results});
        resolve(termCollection);
      }
    });
  });
}

module.exports = {
  sites: sites,
  createOrReplaceSite: createOrReplaceSite,
  modifyFacebookPages: modifyFacebookPages,
  modifyTrustedTwitterAccounts: modifyTrustedTwitterAccounts,
  removeFacebookPages: removeFacebookPages,
  removeTrustedTwitterAccounts: removeTrustedTwitterAccounts,
  modifyTwitterAccounts: modifyTwitterAccounts,
  removeTwitterAccounts: removeTwitterAccounts,
  twitterAccounts: twitterAccounts,
  trustedTwitterAccounts: trustedTwitterAccounts,
  facebookPages: facebookPages,
  facebookAnalytics: facebookAnalytics,
  termBlacklist: termBlacklist,
  modifyBlacklist: modifyBlacklist,
  removeBlacklist: removeBlacklist
};