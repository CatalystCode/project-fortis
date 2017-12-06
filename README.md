# project-fortis-mono

[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-mono.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-mono)

## Background

### Overview

Project Fortis is a data ingestion, analysis and visualization pipeline. The
Fortis pipeline collects social media conversations and postings from the public
web and darknet data sources.

Learn more about Fortis in our [article](https://aka.ms/fortis-story) and in our
[dashboard walkthrough (in Spanish)](http://aka.ms/fortis-colombia-demo).

![Overview of the Fortis project workflow](https://user-images.githubusercontent.com/7635865/31245700-cd8193be-a9d0-11e7-9558-e78dd15951a2.png)

### Monitoring

Fortis is a flexible project and can be configured for many situations, e.g.:
* Ingesting from multiple data sources, including:
  - Twitter
  - Facebook
  - Public Web (via Bing)
  - RSS
  - Reddit
  - Instagram
  - Radio Broadcasts
  - ACLED
* Fortis also comes with pre-configured terms to monitor sites of these types:
  - Humanitarian
  - Climate Change
  - Health

### Architecture

![Overview of the Fortis pipeline architecture](https://user-images.githubusercontent.com/1086421/33353437-d1ed7fc8-d47b-11e7-9f05-818723f8c09c.png)

## Deployment

### Local deployment

First, you need to set up some services in Azure:

```sh
./project-fortis-pipeline/localdeploy/fortis-deploy.sh \
  -i YOUR_SUBSCRIPTION_ID_HERE \
  -g SOME_RESOURCE_GROUP_NAME \
  -l SOME_RESOURCE_GROUP_LOCATION \
  -n SOME_DEPLOYMENT_NAME \
> .env-secrets
```

This script will deploy to Azure a number of services used by Fortis, such as
ServiceBus, EventHubs, Cognitive Services, and so forth. The secrets to access
these services are stored in a `.env-secrets` file which the rest of the
developmnet setup will leverage.

Now you can start the full Fortis pipeline with one command:

```sh
docker-compose up
```

After all the Docker services started, head over to the following URLs to play
with the services:

* Frontend
  - http://localhost:8888/#/site/INSERT_YOUR_SITE_NAME_HERE/admin
  - http://localhost:8888/#/site/INSERT_YOUR_SITE_NAME_HERE
* Backend
  - http://localhost:8889/api/edges/graphiql
  - http://localhost:8889/api/messages/graphiql
  - http://localhost:8889/api/settings/graphiql
  - http://localhost:8889/api/tiles/graphiql
* Spark
  - http://localhost:7777
  - http://localhost:7778
  - http://localhost:7779

### Production deployment

#### Prerequisites

* First and foremost, you'll need an Azure subscription. You can create one for
  free [here](https://azure.microsoft.com/en-us/free/).

* Generate an SSH key pair following [these](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)
  instructions. The contents from the generated `MyKey.pub` file will be used
  for the `SSH Public Key` field in the Azure deployment.

* You'll need an Azure service principal. You can follow these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal)
  if you need to generate a new service principal. During the Azure deployment,
  the `Application ID` will be used for the `Service Principal App ID` field
  and the `Authentication Key` will be used for the `Service Principal App Key`.

#### Setting up a new Azure deployment

Hit the deploy to Azure button below:

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/project-fortis-mono/tree/master?ptmpl=azuredeploy.parameters.json)

Fill in the wizard that comes up:

![Screenshot of ARM wizard](https://user-images.githubusercontent.com/7635865/27882830-e785819c-6193-11e7-9b27-5fc452f23b1a.png)

Now grab a large cup of coffee as the deployment can take north of an hour to
complete.

Once the deployment has finished, click on the `Manage your resources`
(highlighted below).

![Screenshot of ARM template after successful deployment with highlight of management link to access the newly created resource group](https://user-images.githubusercontent.com/1086421/33331326-4437a7fe-d42f-11e7-8b4a-19b968b4705b.png)

Now click on the `Tags` tab in the Azure Portal (highlighted below) and find the
`FORTIS_ADMIN_INTERFACE_URL` (also highlighted below).

![Screenshot of Azure portal with highlight of the Fortis admin site URL accessed via Azure Portal tags](https://user-images.githubusercontent.com/1086421/33331249-1b1ce1f4-d42f-11e7-8341-0100660e9e74.png)

Point your browser to the admin interface URL. Once the Fortis admin portal
loads, you can now finalize the setup of your Fortis deployment using the portal:

![Screenshot showing the Fortis admin interface](https://user-images.githubusercontent.com/1086421/33331562-e9e589be-d42f-11e7-870c-6b758ec2141a.png)

Once you've completed all the admin configuration, your deployment is ready to
be used.

For more detailed information on the admin page, refer to this [guide](https://github.com/CatalystCode/project-fortis-mono/blob/master/project-fortis-pipeline/docs/user/admin.md).