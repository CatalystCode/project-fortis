# project-fortis-services

[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-services.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-services)

## Overview

This repository contains the services tier of the Fortis architecture, below
highlighted in red in the architecture diagram for the entire system.

![Overview of Fortis architecture with project-fortis-services responsibility highlighted](https://user-images.githubusercontent.com/1086421/33336486-15c13cdc-d43e-11e7-9285-c9f580c41c12.png)

This repository implements a NodeJS GraphQL server that sits in between the
Fortis data-store (Cassandra) and the Fortis frontend (React).

## Development setup

As per the diagram above, there are two pieces necessary to run this repository
locally: a Cassandra database and the GraphQL server. You can spin up both of
these pieces using Docker via the following command:

```sh
git clone https://github.com/CatalystCode/project-fortis-services
cd project-fortis-services
docker-compose up
```

The container of the GraphQL server will wait for the Cassandra database to come
live, then set up the database schema, then insert seed data (if a link to a CQL
file is provided via the `FORTIS_CASSANDRA_SEED_DATA_URL` environment variable)
and then start the GraphQL server on port 8080.

After the server started, head over to the following URLs to play with the
service:

- http://localhost:8080/api/edges/graphiql
- http://localhost:8080/api/messages/graphiql
- http://localhost:8080/api/settings/graphiql
- http://localhost:8080/api/tiles/graphiql
