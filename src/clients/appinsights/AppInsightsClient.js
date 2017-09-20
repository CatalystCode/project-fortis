const appInsightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

let client;
let consoleLog = console.log;
let consoleError = console.error;
let consoleWarn = console.warn;

const TRACE_LEVEL_INFO = 1;
const TRACE_LEVEL_WARNING = 2;
const TRACE_LEVEL_ERROR = 3;

function setup() {
  if (appInsightsKey) {
    const appInsights = require('applicationinsights');
    appInsights.setup(appInsightsKey);
    appInsights.start();
    client = appInsights.getClient(appInsightsKey);
    console.log = trackTrace(TRACE_LEVEL_INFO, consoleLog);
    console.warn = trackTrace(TRACE_LEVEL_WARNING, consoleWarn);
    console.error = trackTrace(TRACE_LEVEL_ERROR, consoleError);
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
  function dependencyTracker(...args) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      promiseFunc(...args)
      .then(returnValue => {
        const duration = new Date() - start;
        const success = true;
        if (client) {
          client.trackDependency(dependencyName, callName, duration, success);
        }
        console.log(JSON.stringify({dependency: dependencyName, call: callName, duration, success, args}));
        resolve(returnValue);
      })
      .catch(err => {
        const duration = new Date() - start;
        const success = false;
        if (client) {
          client.trackDependency(dependencyName, callName, duration, success);
        }
        console.error(JSON.stringify({dependency: dependencyName, call: callName, duration, success, err, args}));
        reject(err);
      })
      .catch(reject);
    });
  }

  return dependencyTracker;
}

function trackEvent(promiseFunc, eventName, extraPropsFunc, extraMetricsFunc) {
  extraPropsFunc = extraPropsFunc || ((returnValue, err) => ({})); // eslint-disable-line no-unused-vars

  function eventTracker(...args) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      promiseFunc(...args)
      .then(returnValue => {
        const properties = extraPropsFunc(returnValue, null);
        properties.duration = new Date() - start;
        properties.success = true;
        const metrics = extraMetricsFunc(returnValue, null);
        if (client) {
          client.trackEvent(eventName, properties, metrics);
        }
        console.log(JSON.stringify({event: eventName, properties, args: args && args.length && args[0], metrics}));
        resolve(returnValue);
      })
      .catch(err => {
        const properties = extraPropsFunc(null, err);
        properties.duration = new Date() - start;
        properties.success = false;
        const metrics = extraMetricsFunc(null, err);
        if (client) {
          client.trackEvent(eventName, properties, metrics);
        }
        console.error(JSON.stringify({event: eventName, properties, err, args: args && args.length && args[0], metrics}));
        reject(err);
      })
      .catch(reject);
    });
  }

  return eventTracker;
}

module.exports = {
  trackDependency: trackDependency,
  trackEvent: trackEvent,
  setup: setup
};
