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

module.exports = {
  setup: setup
};
