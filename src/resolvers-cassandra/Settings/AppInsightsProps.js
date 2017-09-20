const uniq = require('lodash/uniq');
const PIPELINE_KEY = 'pipelinekey';

function extraProps(operation, table, collectionName) {
  return function(graphqlResult) {
    const props = {
      operation,
      onTable: table
    };

    const resultCollection = getResultCollection(graphqlResult, collectionName);
    const pipelineKeys = getPipelineKeys(resultCollection);
    props.pipelinekey = pipelineKeys;

    return props;
  };
}

function getResultCollection(graphqlResult, collectionName) {
  if (!graphqlResult || !graphqlResult[collectionName] || !graphqlResult[collectionName].length) return [];
  else return graphqlResult[collectionName];
}

function getPipelineKeys(resultCollection) {
  return uniq(resultCollection.map(result => result[PIPELINE_KEY]));
}

module.exports = {
  extraProps: extraProps
};