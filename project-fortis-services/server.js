'use strict';

const {
  port, enableV2
} = require('./config').server;

require('./src/clients/appinsights/AppInsightsClient').setup();
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');

const EdgesSchema = require('./src/schemas/EdgesSchema');
const MessageSchema = require('./src/schemas/MessageSchema');
const SettingsSchema = require('./src/schemas/SettingsSchema');
const TileSchema = require('./src/schemas/TilesSchema');

const resolversDirectory = enableV2 ? './src/resolvers-cassandra' : './src/resolvers';
const EdgesResolver = require(`${resolversDirectory}/Edges`);
const MessageResolver = require(`${resolversDirectory}/Messages`);
const SettingsResolver = require(`${resolversDirectory}/Settings`);
const TileResolver = require(`${resolversDirectory}/Tiles`);

const app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ms-meta-data*,x-ms-meta-target*,x-ms-meta-abc');

   // intercept OPTIONS method
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

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

const serverStartBlocker = enableV2
  ? require('./src/clients/cassandra/CassandraConnector').initialize()
  : require('promise').resolve();

serverStartBlocker.then(startServer).catch(console.error);