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
  makeSet: makeSet
};
