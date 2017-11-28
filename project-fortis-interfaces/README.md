# project-fortis-interfaces

[![CI status](https://travis-ci.org/CatalystCode/project-fortis-interfaces.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-interfaces)

## Preview

[![Screenshot of dashboard view](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)](https://cloud.githubusercontent.com/assets/7635865/22437397/c57eb276-e6dc-11e6-8fc4-7fdb332aae50.png)
[![Screenshot of event details view](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)](https://cloud.githubusercontent.com/assets/7635865/22437264/42602c94-e6dc-11e6-8f52-21ed96b84ea8.png)

## Overview

This repository contains the user-interface tier of the Fortis architecture, below highlighted in red in the architecture diagram for the entire system.

![Overview of Fortis architecture with project-fortis-interfaces responsibility highlighted](https://user-images.githubusercontent.com/1086421/33343222-91604888-d452-11e7-89cb-a2996aa50c5f.png)

This repository implements a ReactJS application that sits in front of the Fortis services layer.

## Development Setup

As per the diagram above, there are two pieces necessary to run this repository
locally: an instance of the Fortis services layer and the React application in
this repository. You can spin up the former by following the steps described in
the [project-fortis-services](https://github.com/CatalystCode/project-fortis-services)
repository:

```sh
git clone https://github.com/CatalystCode/project-fortis-services
cd project-fortis-services
docker-compose up -d
```

After the services layer is created, you can run the React application:

```sh
git clone https://github.com/CatalystCode/project-fortis-interfaces.git
cd project-fortis-interfaces
docker-compose up
```

After the server started, head over to the following URLs to play with the service:
- http://localhost:8888/#/site/INSERT_YOUR_SITE_NAME_HERE/admin
- http://localhost:8888/#/site/INSERT_YOUR_SITE_NAME_HERE

## Production setup

Build production asset bundle and run locally:

```sh
npm run build
npm install -g pushstate-server
pushstate-server build
```
