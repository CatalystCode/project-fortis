# Fortis development setup

[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis)

## One-time setup

### Getting the code

First, you need to get the code:

```sh
git clone https://github.com/CatalystCode/project-fortis.git
cd project-fortis
```

### Setting up Azure resources

Then, you need to set up some services in Azure by running the following Bash
script (e.g. via the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about)):

```sh
./project-fortis-pipeline/localdeploy/setup-development-azure-resources.sh \
  -i YOUR_SUBSCRIPTION_ID_HERE \
  -l YOUR_CLOSEST_AZURE_LOCATION_HERE \
  -o .env-secrets
```

This script will deploy to Azure a number of services used by Fortis, such as
ServiceBus, EventHubs, Cognitive Services, and so forth. The secrets to access
these services are stored in a `.env-secrets` file which the rest of the
development setup will leverage. All the services are stored inside of a single
resource group whose name is stored under the `FORTIS_RESOURCE_GROUP_NAME` key
in the secrets file.

### Generating Mapbox access token

Next, you need to create a Mapbox access token. If you don't have one yet, you
can create a new one for free by [signing up](https://www.mapbox.com/signup/).
Once you have the token, append it to the `.env-secrets` file like so:

```
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### Authentication

You may also want to add your email address to the `USERS` or `ADMINS` list in
the `.env` file; otherwise you wouldn't be able to log into your Fortis site!
Alternatively, you can also clear out the value for the key `AD_CLIENT_ID` in
the `.env` file in order to disable authentication entirely. This is for example
useful if you want to talk directly to the GraphQL server via the GraphiQL tool
instead of accessing the API endpoints via the UI.

### Preparing Docker

This project runs entirely inside of Docker containers orchestrated by
docker-compose, so please ensure that you have installed Docker on your system,
e.g. [Docker for Windows](https://docs.docker.com/docker-for-windows/install/).

We're using a volume mount to enable support for code hot-reload. As such,
please ensure that you've shared the drive on which your code resides with
Docker via the "Shared Drives" tab in the [Docker settings](https://docs.docker.com/docker-for-windows/#docker-settings).

<img src="https://user-images.githubusercontent.com/1086421/34893261-6b615fca-f7aa-11e7-80bc-833ee2d8c9a7.png"
     title="Example 'Shared Drives' Docker settings for a Fortis developer who has the project-fortis code on the C: drive"
     height="400" />

The containers created for this project use quite a lot of resources, so if any
of the services die with exit code 137, please give more memory to Docker via
the "Advanced" tab in the [Docker settings](https://docs.docker.com/docker-for-windows/#docker-settings).

<img src="https://user-images.githubusercontent.com/1086421/34893275-7ef30872-f7aa-11e7-8514-e1e17bf4064e.png"
     title="Example 'Advanced' Docker settings for a Fortis developer with a machine that has 8 GB of RAM."
     height="400" />

## Running the service

Now you can start the full Fortis pipeline with one command:

```sh
docker-compose up --build
```

This will start all the Docker services and gather logs in the terminal. After
all the Docker services started, head over to the following URLs to play with
the services:

* Frontend
  - http://localhost:8888/#/dashboard
  - http://localhost:8888/#/facts
  - http://localhost:8888/#/settings
* Backend
  - http://localhost:8889/api/edges/graphiql
  - http://localhost:8889/api/messages/graphiql
  - http://localhost:8889/api/settings/graphiql
  - http://localhost:8889/api/tiles/graphiql
* Spark
  - http://localhost:7777/jobs/

After making changes, you can re-build and re-start the affected services using:

```sh
docker-compose up --build -d
```

Note that any changes to the React code in project-fortis-interfaces folder will
be automatically detected and re-loaded so the re-build step above won't be
necessary for changes to the frontend.

## Tips and tricks

### Accessing Cassandra

If you need more low-level access to the Cassandra database, you can execute the
following command to log into a CQL shell:

```
docker-compose exec project_fortis_services /app/cqlsh
```

### Too many Twitter connections

If you're getting an error from project-fortis-spark that there are too many
simultaneous Twitter connections, please follow these steps:

1. Create a new set of [Twitter credentials](https://apps.twitter.com/app/new).
2. Make a copy of the [seed-data-twitter.tar.gz](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/ops/storage-ddls/seed-data-twitter.tar.gz) archive, e.g. suffixing it with your name.
3. Update the `streams.csv` file in your copy of the archive with your Twitter credentials.
4. Commit and push your copy of the archive.
5. Edit the `CASSANDRA_SEED_DATA_URL` variable in the `.env` file to point to your copy of the archive.
