'use strict';

var port = process.env.PORT || 8000;  

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var graphqlHTTP = require('express-graphql');
var SpatialMessageSchema = require('./src/schemas/MessageSchema');
var SpatialMessageResolver = require('./src/resolvers/Messages');
var FactsSchema = require('./src/schemas/FactSchema');
var FactsResolver = require('./src/resolvers/Facts');
var TileSchema = require('./src/schemas/TilesSchema');
var TileResolver = require('./src/resolvers/Tiles');
var EdgesSchema = require('./src/schemas/EdgesSchema');
var EdgesResolver = require('./src/resolvers/Edges');
var SettingsResolver = require('./src/resolvers/Settings');
var SettingsSchema = require('./src/schemas/SettingsSchema');

var app = express();

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ms-meta-data*,x-ms-meta-target*,x-ms-meta-abc');

   // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

console.log('PORT: ' + port);

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/api/messages', graphqlHTTP({
    schema: SpatialMessageSchema,
    rootValue: SpatialMessageResolver,
    graphiql: true
}));

app.use('/api/facts', graphqlHTTP({
    schema: FactsSchema,
    rootValue: FactsResolver,
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

var server = http.createServer(app);

server.listen(port, function () {});