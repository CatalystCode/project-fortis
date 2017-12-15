const Long = require('cassandra-driver').types.Long;

function _sortByMentionCount(rows) {
  return rows.sort((a, b) => b.mentions - a.mentions);
}

function _computeWeightedSentiment(rows) {
  return rows.map(row => Object.assign({}, row, { avgsentiment:  computeWeightedAvg(row.mentions, row.avgsentimentnumerator) }));
}

function computeWeightedAvg(mentioncount, weightedavgnumerator) {
  const DoubleToLongConversionFactor = 1000;

  return !mentioncount.isZero() ? (weightedavgnumerator / DoubleToLongConversionFactor) / mentioncount : 0;
}

function makeMap(iterable, keyFunc, valueFunc) {
  const map = {};
  iterable.forEach(item => {
    const key = keyFunc(item);
    const value = valueFunc(item);
    map[key] = value;
  });
  return map;
}

function makeSet(iterable, func) {
  const set = new Set();
  iterable.forEach(item => set.add(func(item)));
  return set;
}

function aggregateBy(rows, aggregateKey, aggregateValue) {
  let accumulationMap = new Map();

  rows.forEach(row => {
    const key = aggregateKey(row);
    const mapEntry = accumulationMap.has(key) ? accumulationMap.get(key) : aggregateValue(row);
    const mutatedRow = Object.assign({}, mapEntry, {
      mentions: (mapEntry.mentions || Long.ZERO).add(row.mentioncount),
      avgsentimentnumerator: (mapEntry.avgsentimentnumerator || Long.ZERO).add(row.avgsentimentnumerator || Long.ZERO)
    });

    accumulationMap.set(key, mutatedRow);
  });

  return _sortByMentionCount(_computeWeightedSentiment(Array.from(accumulationMap.values())));
}

module.exports = {
  makeMap,
  aggregateBy,
  makeSet,
  computeWeightedAvg
};
