const appInsightsKey = process.env.FORTIS_SERVICES_APPINSIGHTS_KEY;

let client;

function setup() {
  if (appInsightsKey) {
    const appInsights = require('applicationinsights');
    appInsights.setup(appInsightsKey);
    appInsights.start();
    client = appInsights.getClient(appInsightsKey);
  }
}

function trackDependency(promiseFunc, dependencyName, callName) {
  if (!client) {
    console.log('Application insights not enabled');
    return promiseFunc;
  }

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
