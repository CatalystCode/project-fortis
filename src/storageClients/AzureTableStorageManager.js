'use strict';

let azureStorage = require('azure-storage');
const AZURE_TBL_KEYWORD = 'searchTerms';
const AZURE_TBL_SITES = 'fortisSites';
const AZURE_TBL_BLACKLIST = 'keywordFilters';
const AZURE_TBL_FB_PAGES = 'fortisFacebookPages';
const AZURE_TBL_TWITTER_ACCOUNTS = 'fortisTwitterAccounts';
const AZURE_TBL_TRUSTED_TWITTER_ACCOUNTS = 'fortisTrustedTwitterAccounts';
const AZURE_TBL_SITES_PARTITION_KEY = 'site';
const AZURE_TABLE_BATCH_MAX_OPERATIONS = 100;
const AZURE_TABLE_BATCH_ACTIONS = {
  DELETE: 1,
  INSERT_OR_MODIFY: 2
};

function GetAzureTblBatchAction(offset, partitionKey, tasks, action){
  const batch = new azureStorage.TableBatch();

  if(Array.isArray(tasks) && offset < tasks.length){
    const upperBounds = offset + AZURE_TABLE_BATCH_MAX_OPERATIONS < tasks.length ? offset + AZURE_TABLE_BATCH_MAX_OPERATIONS : tasks.length;
    const batchTasks = tasks.slice(offset, upperBounds);
    batchTasks.forEach(operation => {
      const task = Object.assign({}, operation);

      if(action === AZURE_TABLE_BATCH_ACTIONS.DELETE){
        batch.deleteEntity(task);
      }else if(action === AZURE_TABLE_BATCH_ACTIONS.INSERT_OR_MODIFY){
        batch.insertOrReplaceEntity(task);
      }else{
        console.error(`${action} is an unsupported azure table action`);
      }
    });
  }

  return batch;
}

function GetKeywordsFromAzureTbl(siteKey, tableService, callback){
  const queryString = 'PartitionKey eq ?';
  const query = new azureStorage.TableQuery().where(queryString, siteKey);

  tableService.createTableIfNotExists(AZURE_TBL_KEYWORD, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_KEYWORD, query, null, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          callback(undefined, result.entries ? result.entries.map(term => {
            let keyword = {'type': 'Term', 'name': term.name._, 'RowKey': term.RowKey._};
            Object.keys(term).forEach(entityField=>{
              if(entityField.startsWith('name_') && term[entityField]._){
                keyword[entityField] = term[entityField]._.toLowerCase();
              }
            });

            return keyword;
          }) : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_SITES}] siteId[${siteKey}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

function GetFbPagesFromAzureTbl(siteKey, tableService, callback){
  const queryString = 'PartitionKey eq ?';
  const query = new azureStorage.TableQuery().where(queryString, siteKey);

  tableService.createTableIfNotExists(AZURE_TBL_FB_PAGES, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_FB_PAGES, query, null, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          callback(undefined, result.entries ? result.entries.map(page => Object.assign({}, {'pageUrl': page.pageUrl._, 'RowKey': page.RowKey._})) : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_FB_PAGES}] siteId[${siteKey}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

function GetBlacklistFromAzureTbl(siteKey, tableService, callback){
  const queryString = 'PartitionKey eq ?';
  const query = new azureStorage.TableQuery().where(queryString, siteKey);

  tableService.createTableIfNotExists(AZURE_TBL_BLACKLIST, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_BLACKLIST, query, null, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          callback(undefined, result.entries ? result.entries.map(filter => {
            const filteredTerm = Object.assign({}, {
              'filteredTerms': filter.filteredTerms ? JSON.parse(filter.filteredTerms._) : [],
              'RowKey': filter.RowKey._,
              'lang': filter.lang._
            });

            return filteredTerm;
          }) : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_FB_PAGES}] siteId[${siteKey}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

function GetTwitterAccountsFromAzureTbl(siteKey, tableService, callback){
  const queryString = 'PartitionKey eq ?';
  const query = new azureStorage.TableQuery().where(queryString, siteKey);

  tableService.createTableIfNotExists(AZURE_TBL_TWITTER_ACCOUNTS, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_TWITTER_ACCOUNTS, query, null, (error, result2, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          callback(undefined, result2.entries ? result2.entries.map(acct => {
            let account = {'consumerSecret': acct.consumerSecret ? acct.consumerSecret._ : '',
                                           'consumerKey': acct.consumerKey ? acct.consumerKey._ : '',
                                           'accountName': acct.RowKey._,
                                           'token': acct.token ? acct.token._ : '',
                                           'tokenSecret': acct.tokenSecret ? acct.tokenSecret._ : ''
                                          };

            return account;
          }) : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_TWITTER_ACCOUNTS}] siteId[${siteKey}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

function GetTrustedTwitterAccountsFromAzureTbl(siteKey, tableService, callback){
  const queryString = 'PartitionKey eq ?';
  const query = new azureStorage.TableQuery().where(queryString, siteKey);

  tableService.createTableIfNotExists(AZURE_TBL_TRUSTED_TWITTER_ACCOUNTS, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_TRUSTED_TWITTER_ACCOUNTS, query, null, (error, result2, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          callback(undefined, result2.entries ? result2.entries.map(account => Object.assign({}, {'acctUrl': account.acctUrl._, 'RowKey': account.RowKey._})) : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_FB_PAGES}] siteId[${siteKey}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

function FetchSiteDefinitions(siteId, tableService, callback){
  const queryString = `PartitionKey eq ?${siteId ? ' and RowKey eq ?' : ''}`;
  const query = new azureStorage.TableQuery().where(queryString, AZURE_TBL_SITES_PARTITION_KEY, siteId);

  tableService.createTableIfNotExists(AZURE_TBL_SITES, (error, result, response) => { // eslint-disable-line no-unused-vars
    if(!error){
      tableService.queryEntities(AZURE_TBL_SITES, query, null, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(!error){
          const siteEntities = result.entries.map(site => {
            return {
              'name': site.RowKey._,
              'properties': {
                'logo': site.logo ? site.logo._ : '',
                'title': site.title ? site.title._ : '',
                'supportedLanguages': site.supportedLanguages ? JSON.parse(site.supportedLanguages._) : [],
                'defaultZoomLevel': site.defaultZoomLevel._,
                'fbToken': site.fbToken ? site.fbToken._ : '',
                'mapzenApiKey': site.mapzenApiKey ? site.mapzenApiKey._ : '',
                'targetBbox': site.targetBbox ? JSON.parse(site.targetBbox._) : [],
                'defaultLocation': site.defaultLocation ? JSON.parse(site.defaultLocation._) : [],
                'storageConnectionString': site.storageConnectionString ? site.storageConnectionString._ : '',
                'featuresConnectionString': site.featuresConnectionString ? site.featuresConnectionString._ : ''
              }
            };
          });
          callback(undefined, result.entries ? siteEntities : []);
        }else{
          callback(`There was an error querying table [${AZURE_TBL_SITES}] siteId[${siteId}]`);
        }
      });
    }else{
      callback('Error occured while trying to create azure table.', undefined);
    }
  });
}

module.exports = {
  AZURE_TABLE_BATCH_ACTIONS,
  GetSiteDefinition(siteId, callback){
    FetchSiteDefinitions(siteId, azureStorage.createTableService(), callback);
  },

  InsertOrReplaceSiteDefinition(siteDefintion, callback){
    let tableService = azureStorage.createTableService();
    const tableEnity = Object.assign({}, siteDefintion, {
      defaultLocation: JSON.stringify(siteDefintion.defaultLocation),
      targetBbox: JSON.stringify(siteDefintion.targetBbox),
      supportedLanguages: JSON.stringify(siteDefintion.supportedLanguages),
      PartitionKey: AZURE_TBL_SITES_PARTITION_KEY,
      RowKey: siteDefintion.name
    });

    tableService.createTableIfNotExists(AZURE_TBL_SITES, (error, result, response) => { // eslint-disable-line no-unused-vars
      if(!error){
        tableService.insertOrReplaceEntity(AZURE_TBL_SITES, tableEnity, (error2, result, response) => { // eslint-disable-line no-unused-vars
          if(!error2){
            FetchSiteDefinitions(siteDefintion.name, tableService, callback);
          }else{
            callback(`There was an error writing to table [${AZURE_TBL_SITES}] with definition[${JSON.stringify(tableEnity)}]`);
          }
        });
      }else{
        callback('Error occured while trying to create azure table.', undefined);
      }
    });
  },

  GetKeywordList(siteKey, callback){
    GetKeywordsFromAzureTbl(siteKey, azureStorage.createTableService(), callback);
  },
  GetTwitterAccounts(siteKey, callback){
    GetTwitterAccountsFromAzureTbl(siteKey, azureStorage.createTableService(), callback);
  },
  GetTrustedTwitterAccounts(siteKey, callback){
    GetTrustedTwitterAccountsFromAzureTbl(siteKey, azureStorage.createTableService(), callback);
  },
  GetFacebookPages(siteKey, callback){
    GetFbPagesFromAzureTbl(siteKey, azureStorage.createTableService(), callback);
  },
  GetBlacklistTerms(siteKey, callback){
    GetBlacklistFromAzureTbl(siteKey, azureStorage.createTableService(), callback);
  },
  ModifyTermEntities(terms, siteKey, action, callback){
    const tableService = azureStorage.createTableService();
    let offset = 0, batchedOperationSize = 0;
    while(offset < terms.length){
      const batch = GetAzureTblBatchAction(offset, siteKey, terms, action);
      batchedOperationSize += batch.size();
      tableService.executeBatch(AZURE_TBL_KEYWORD, batch, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(error) {
          callback('Error occured while trying to remove entities from azure table.', undefined);

          return;
        }else if(batchedOperationSize === terms.length){//we removed all requested entities
          GetKeywordsFromAzureTbl(siteKey, tableService, callback);
        }
      });

      offset += AZURE_TABLE_BATCH_MAX_OPERATIONS;
    }
  },
  ModifyBlacklistTerms(terms, siteKey, action, callback){
    const tableService = azureStorage.createTableService();
    let offset = 0, batchedOperationSize = 0;
    while(offset < terms.length){
      const batch = GetAzureTblBatchAction(offset, siteKey, terms, action);
      batchedOperationSize += batch.size();
      tableService.executeBatch(AZURE_TBL_BLACKLIST, batch, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(error) {
          callback('Error occured while trying to remove entities from azure table.', undefined);

          return;
        }else if(batchedOperationSize === terms.length){//we removed all requested entities
          GetBlacklistFromAzureTbl(siteKey, tableService, callback);
        }
      });

      offset += AZURE_TABLE_BATCH_MAX_OPERATIONS;
    }
  },
  ModifyTwitterAccounts(siteId, twitterAccounts, action, callback){
    const tableService = azureStorage.createTableService();
    let offset = 0, batchedOperationSize = 0;

    while(offset < twitterAccounts.length){
      const batch = GetAzureTblBatchAction(offset, siteId, twitterAccounts, action);
      batchedOperationSize += batch.size();
      tableService.executeBatch(AZURE_TBL_TWITTER_ACCOUNTS, batch, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(error) {
          callback('Error occured while trying to remove entities from azure table.', undefined);

          return;
        }else if(batchedOperationSize === twitterAccounts.length){//we removed all requested entities
          GetTwitterAccountsFromAzureTbl(siteId, tableService, callback);
        }
      });

      offset += AZURE_TABLE_BATCH_MAX_OPERATIONS;
    }
  },
  ModifyTrustedTwitterAccounts(siteId, trustedTwitterAccounts, action, callback){
    const tableService = azureStorage.createTableService();
    let offset = 0, batchedOperationSize = 0;

    while(offset < trustedTwitterAccounts.length){
      const batch = GetAzureTblBatchAction(offset, siteId, trustedTwitterAccounts, action);
      batchedOperationSize += batch.size();
      tableService.executeBatch(AZURE_TBL_TRUSTED_TWITTER_ACCOUNTS, batch, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(error) {
          callback('Error occured while trying to remove entities from azure table.', undefined);

          return;
        }else if(batchedOperationSize === trustedTwitterAccounts.length){//we removed all requested entities
          GetTrustedTwitterAccountsFromAzureTbl(siteId, tableService, callback);
        }
      });

      offset += AZURE_TABLE_BATCH_MAX_OPERATIONS;
    }
  },
  ModifyFacebookPages(siteId, fbPages, action, callback){
    const tableService = azureStorage.createTableService();
    let offset = 0, batchedOperationSize = 0;

    while(offset < fbPages.length){
      const batch = GetAzureTblBatchAction(offset, siteId, fbPages, action);
      batchedOperationSize += batch.size();
      tableService.executeBatch(AZURE_TBL_FB_PAGES, batch, (error, result, response) => { // eslint-disable-line no-unused-vars
        if(error) {
          callback('Error occured while trying to modify entities from azure table.', undefined);

          return;
        }else if(batchedOperationSize === fbPages.length){//we removed all requested entities
          GetFbPagesFromAzureTbl(siteId, tableService, callback);
        }
      });

      offset += AZURE_TABLE_BATCH_MAX_OPERATIONS;
    }
  }
};