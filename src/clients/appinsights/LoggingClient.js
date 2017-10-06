const { trackSyncEvent } = require('../appinsights/AppInsightsClient');
const constants = require('../appinsights/AppInsightsConstants');

function logCassandraClientUndefined() {
  trackSyncEvent('cassandra', {
    client: constants.CLIENTS.cassandra,
    operation: 'connect',
    success: 'false'
  }, {});
}

function logNoMutationsDefined() {
  trackSyncEvent('cassandra', { 
    client: constants.CLIENTS.cassandra,
    operation: 'mutate',
    success: 'false'
  }, {
    numToMutate: 0
  });
}

function logExecuteQueryError() {
  trackSyncEvent('cassandra', { 
    client: constants.CLIENTS.cassandra,
    operation: 'query',
    success: 'false'
  }, {
    totalRows: 0
  });
}

function termsExtraProps() {
  return () => ({
    operation: 'query',
    table: 'watchlist',
    success: 'true'
  });
}

function addKeywordsExtraProps() {
  return () => ({
    operation: 'modify',
    table: 'watchlist',
    success: 'true'
  });
}

function removeKeywordsExtraProps() {
  return () => ({
    operation: 'remove',
    table: 'watchlist',
    success: 'true'
  });
}

function keywordsExtraMetrics() {
  return (graphqlResult) => {
    const totalRows = graphqlResult.edges.length; //TODO
    return {
      totalRows
    };
  };
}

function logNoKeywordsToAdd() {
  trackSyncEvent('cassandra', { 
    client: constants.CLIENTS.cassandra,
    operation: 'modify',
    table: 'watchlist',
    success: false
  }, {
    numToMutate: 0
  });
}

function logNoKeywordsToRemove() {
  trackSyncEvent('cassandra', { 
    client: constants.CLIENTS.cassandra,
    operation: 'remove',
    table: 'watchlist',
    success: 'false'
  },{
    numToMutate: 0
  });
}

function translateExtraProps() {
  return () => ({
    operation: 'translate',
    success: 'true'
  });
}

function translateExtraMetrics() {
  return (graphqlResult) => {
    const totalRows = graphqlResult && graphqlResult.translate && graphqlResult.translate.words && graphqlResult.translate.words.length;
    return {
      totalRows
    };
  };
}

function translateWordsExtraMetrics() {
  return (graphqlResult) => {
    const totalRows = graphqlResult && graphqlResult.translateWords && graphqlResult.translateWords.words && graphqlResult.translateWords.words.length;
    return {
      totalRows
    };
  };
}

module.exports = {
  logCassandraClientUndefined,
  logNoMutationsDefined,
  logExecuteQueryError,
  termsExtraProps,
  addKeywordsExtraProps,
  removeKeywordsExtraProps,
  keywordsExtraMetrics,
  logNoKeywordsToAdd,
  logNoKeywordsToRemove,
  translateExtraProps,
  translateExtraMetrics,
  translateWordsExtraMetrics
};