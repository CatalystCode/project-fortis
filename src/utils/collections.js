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

function cross(a, b) {
  if (!a || !a.length) return b.map(item => ({right: item}));
  if (!b || !b.length) return a.map(item => ({left: item}));

  const crossProduct = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      crossProduct.push({left: a[i], right: b[j]});
    }
  }
  return crossProduct;
}

module.exports = {
  cross: cross,
  makeMap: makeMap,
  makeSet: makeSet
};
