'use strict';

const {
  port
} = require('./config').server;

require('./src/clients/appinsights/AppInsightsClient').setup();
const http = require('http');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');

const EdgesSchema = require('./src/schemas/EdgesSchema');
const MessageSchema = require('./src/schemas/MessageSchema');
const SettingsSchema = require('./src/schemas/SettingsSchema');
const TileSchema = require('./src/schemas/TilesSchema');

const EdgesResolver = require('./src/resolvers/Edges');
const MessageResolver = require('./src/resolvers/Messages');
const SettingsResolver = require('./src/resolvers/Settings');
const TileResolver = require('./src/resolvers/Tiles');

const app = express();

app.use(cors({ origin: true, credentials: true }));
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

const serverStartBlocker = require('./src/clients/cassandra/CassandraConnector').initialize();

serverStartBlocker.then(startServer).catch(console.error);