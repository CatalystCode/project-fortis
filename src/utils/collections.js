const Long = require('cassandra-driver').types.Long;

function _sortByMentionCount(rows) {
  return rows.sort((a, b) => b.mentions - a.mentions);
}

function _computeWeightedSentiment(rows) {
  return rows.map(row => Object.assign({}, row, { avgsentiment:  _computeWeightedAvg(row.mentions, row.avgsentimentnumerator) }));
}

function _computeWeightedAvg(mentioncount, weightedavgnumerator) {
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

function makeMultiMap(iterable, keyFunc, valueFunc) {
  const map = {};
  iterable.forEach(item => {
    const key = keyFunc(item);
    let value = map[key];
    if (!value) value = map[key] = [];
    value.push(valueFunc(item));
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

function cross(A, B, C) {
  A = A && A.length ? A : [undefined];
  B = B && B.length ? B : [undefined];
  C = C && C.length ? C : [undefined];

  const crossProduct = [];
  for (let iA = 0; iA < A.length; iA++) {
    for (let iB = 0; iB < B.length; iB++) {
      for (let iC = 0; iC < C.length; iC++) {
        crossProduct.push({a: A[iA], b: B[iB], c: C[iC]});
      }
    }
  }
  return crossProduct;
}

module.exports = {
  cross: cross,
  makeMap: makeMap,
  aggregateBy,
  makeMultiMap,
  makeSet: makeSet
};
