'use strict';

const { port } = require('./config').server;
const { fortisFeatureServiceHost } = require('./config').featureService;

const http = require('http');
const cors = require('cors');
const express = require('express');
const proxy = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');

const initializeAppInsights = require('./src/clients/appinsights/AppInsightsClient').setup;
const initializeCassandra = require('./src/clients/cassandra/CassandraConnector').initialize;
const initializeAuth = require('./src/auth').initialize;

const EdgesSchema = require('./src/schemas/EdgesSchema');
const MessageSchema = require('./src/schemas/MessageSchema');
const SettingsSchema = require('./src/schemas/SettingsSchema');
const TileSchema = require('./src/schemas/TilesSchema');

const EdgesResolver = require('./src/resolvers/Edges');
const MessageResolver = require('./src/resolvers/Messages');
const SettingsResolver = require('./src/resolvers/Settings');
const TileResolver = require('./src/resolvers/Tiles');

const healthCheckHandler = require('./src/routes/healthcheck');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/proxy/featureservice', proxy({
  target: fortisFeatureServiceHost,
  pathRewrite: { '^/proxy/featureservice': '' },
}));

app.get('/healthcheck', healthCheckHandler);

initializeAuth(app, '/api');

app.use('/api/messages', graphqlHTTP({
  schema: MessageSchema,
  rootValue: MessageResolver,
  graphiql: true
}));

app.use('/api/edges', graphqlHTTP({
  schema: EdgesSchema,
  rootValue: EdgesResolver,
  graphiql: true
}));

app.use('/api/tiles', graphqlHTTP({
  schema: TileSchema,
  rootValue: TileResolver,
  graphiql: true
}));

app.use('/api/settings', graphqlHTTP({
  schema: SettingsSchema,
  rootValue: SettingsResolver,
  graphiql: true
}));

function startServer() {
  console.log(`PORT: ${port}`);
  const server = http.createServer(app);
  server.listen(port, function () {});
}

function shutdownServer(error) {
  console.error(error);
  process.exit(1);
}

initializeAppInsights();
initializeCassandra().then(startServer).catch(shutdownServer);
