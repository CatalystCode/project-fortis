const extraMetrics = (collectionName) => {
  return function(graphqlResult) {
    const rows = getTotalRows(graphqlResult, collectionName);

    return {
      totalRows: rows
    };
  };
};

function getTotalRows(graphqlResult, collectionName) {
  if (!graphqlResult || !graphqlResult[collectionName] || !graphqlResult[collectionName].length) return 0;
  else return graphqlResult[collectionName].length;
}

module.exports = {
  extraMetrics: extraMetrics
};