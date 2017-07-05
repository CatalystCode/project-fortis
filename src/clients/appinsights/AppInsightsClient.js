const appInsightsKey = process.env.FORTIS_SERVICES_APPINSIGHTS_KEY;

let client;
let consoleLog = console.log;
let consoleError = console.error;
let consoleWarn = console.warn;

function setup() {
  if (appInsightsKey) {
    const appInsights = require('applicationinsights');
    appInsights.setup(appInsightsKey);
    appInsights.start();
    client = appInsights.getClient(appInsightsKey);
    console.log = trackTrace(/* INFO */ 1, consoleLog);
    console.error = trackTrace(/* ERROR */ 3, consoleError);
    console.warn = trackTrace(/* WARNING */ 2, consoleWarn);
  }
}

function trackTrace(level, localLogger) {
  return (message) => {
    if (client) {
      client.trackTrace(message, level);
    }
    localLogger(message);
  };
}

function trackDependency(promiseFunc, dependencyName, callName) {
  if (!client) return promiseFunc;

  function dependencyTracker(...args) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      promiseFunc(...args)
      .then(returnValue => {
        const duration = new Date() - start;
        const success = true;
        client.trackDependency(dependencyName, callName, duration, success);
        resolve(returnValue);
      })
      .catch(err => {
        const duration = new Date() - start;
        const success = false;
        client.trackDependency(dependencyName, callName, duration, success);
        reject(err);
      });
    });
  }

  return dependencyTracker;
}

module.exports = {
  trackDependency: trackDependency,
  setup: setup
};
