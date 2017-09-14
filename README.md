# Fortis Insight Dashboard

[![CI status](https://travis-ci.org/CatalystCode/project-fortis-interfaces.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-interfaces)

An Early Warning Humanitarian Crisis Detection Platform

## Preview

[![Preview](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)
[![Preview](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)

## Development Setup

The interfaces project has a few service dependencies, configured via environment variables:

```sh
REACT_APP_SERVICE_HOST="http://localhost:8000"          # https://github.com/CatalystCode/project-fortis-services
REACT_APP_FEATURE_SERVICE_HOST="http://localhost:3035"  # https://github.com/CatalystCode/featureService
```

Now set up and run the fortis-interfaces project in development mode:

```sh
git clone https://github.com/CatalystCode/fortis-interface.git
cd fortis-interface
npm install
npm start
```

Open [http://localhost:3000/#/site/{ENTER_YOUR_SITE_NAME}/](http://localhost:3000/#/site/{ENTER_YOUR_SITE_NAME}/) to view your fortis site in the browser.

The page will reload if you make edits. You will see the build errors and lint warnings in the console.

## Production setup

Build production asset bundle

```sh
npm run build
```

Host locally

```sh
npm install -g pushstate-server
pushstate-server build
```
