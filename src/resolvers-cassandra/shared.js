'use strict';

const Promise = require('promise');

function withRunTime(promiseFunc) {
  function runTimer() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      promiseFunc.apply(this, arguments)
      .then(returnValue => {
        const endTime = Date.now();
        returnValue.runTime = endTime - startTime;
        resolve(returnValue);
      })
      .catch(reject);
    });
  }

  return runTimer;
}

module.exports = {
  withRunTime: withRunTime
};
