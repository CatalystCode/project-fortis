# Fortis Insight Dashboard
An Early Warning Humanitarian Crisis Detection Platform
# Preview
[![Preview](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)
[![Preview](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)

### Environment Setup
##### Define the Graph QL service host. This should be set to a local fortis service host [https://github.com/CatalystCode/fortis-services](https://github.com/CatalystCode/fortis-services)

`set REACT_APP_SERVICE_HOST = http://localhost:8000`

##### Grab the azure storage connection string.
`set AZURE_STORAGE_CONNECTION_STRING = DefaultEndpointsProtocol=https;AccountName=fortisaccount;AccountKey=xxx==`


### Local Installation
```
git clone https://github.com/CatalystCode/fortis-interface.git
cd fortis-interface
npm install
```

### Run in Development mode 
```
npm start
```

Runs the app in development mode.
Open [http://localhost:3000/#/site/{ENTER_YOUR_SITE_NAME}/](http://localhost:3000/#/site/{ENTER_YOUR_SITE_NAME}/) to view your fortis site in the browser.

The page will reload if you make edits.
You will see the build errors and lint warnings in the console.

### Test Watcher
Runs the test watcher in an interactive mode.
By default, runs tests related to files changes since the last commit.

```
npm test
```

### Build production asset bundle

```
npm run build
```

##### Host locally
```
npm install -g pushstate-server
pushstate-server build
```

## What’s Inside?

The tools used by Fortis are subject to change.
Currently it the front-end interface is a thin layer on top of many amazing community projects, such as:
* [react 15.4.2](https://facebook.github.io/react/)
* [webpack](https://webpack.github.io/) with [webpack-dev-server](https://github.com/webpack/webpack-dev-server), [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) and [style-loader](https://github.com/webpack/style-loader)
* [Babel](http://babeljs.io/) with ES6 and extensions used by Facebook (JSX, [object spread](https://github.com/sebmarkbage/ecmascript-rest-spread/commits/master), [class properties](https://github.com/jeffmo/es-class-public-fields))
* [Autoprefixer](https://github.com/postcss/autoprefixer)
* [ESLint](http://eslint.org/)
* [Jest](http://facebook.github.io/jest)
* [recharts](http://recharts.org)
* [leaflet](http://leafletjs.com/)
* [react-grid-layout](https://strml.github.io/react-grid-layout/examples/0-showcase.html)
* flux
* material-ui
* bootstrap

All of them are transitive dependencies of the provided npm package.

## License

The React Native Windows plugin is provided under the [MIT License](LICENSE).

## Contributing

We'd love to have your helping hand with continuing to make Fortis great and useful for the broader humanitarian community! Our contribution guidelines will be coming soon.



