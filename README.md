[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-pipeline.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-pipeline)

# deploy fortis pipeline
Deploy your own Fortis pipeline to an azure subscription through a single click. 

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/fortis-containers/tree/master?ptmpl=azuredeploy.parameters.json)
![fortisadminoverview](https://user-images.githubusercontent.com/7635865/31245700-cd8193be-a9d0-11e7-9558-e78dd15951a2.png)


## Pipeline Architecture
A fully containerized realtime spark pipeline powered off Kubernetes. 
![fortis_overview](https://user-images.githubusercontent.com/7635865/29438127-927a70e8-8369-11e7-9158-85d78ceb16c9.png)

## Background
Project Fortis is a data ingestion, analysis and visualization pipeline. The Fortis pipeline collects social media conversations and postings from the public web and darknet data sources. 

## Related Repositories
* Spark-based Pipeline: https://github.com/CatalystCode/project-fortis-spark
* Dashboard Interface: https://github.com/CatalystCode/project-fortis-interfaces
* Graphql Services: https://github.com/CatalystCode/project-fortis-services
* Kubernetes Helm Charts: https://github.com/CatalystCode/charts

## Documentation
- [Deploy to Azure Steps]()
- [Deploy to Local Machine Steps](docs/local-deploy.md)
- [Upgrading the Fortis Spark Pipeline](docs/upgrading.md)
- [Upgrading the Fortis Interface](docs/interface-upgrade.md)

## Demo Videos
- [Dashboard Walkthrough in Spanish](http://aka.ms/fortis-colombia-demo)

![image](https://user-images.githubusercontent.com/7635865/27882830-e785819c-6193-11e7-9b27-5fc452f23b1a.png)

## Deployment Prerequisites
* First and foremost, you'll need an existing azure subscription. You can create one for free [here](https://azure.microsoft.com/en-us/free/). 
* Generate a Public / Private ssh key pair following [these](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/) instructions. The contents from the generated `MyKey.pub` file will be used for the `SSh Public Key` field. 
* You'll need an existing azure service principal. You can follow these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal) if you need to generate a new service principal. Your service principles `Application ID` will be used for the `Service Principal App ID` field, and the `Authentication Key` will be used for the `Service Principal App Key`. 

## Fortis Monitored Data Sources

* Public Web - Bing
* Reddit
* Twitter
* Facebook
* Instagram
* Radio Broadcasts
* ACLED

## Site Types
* The site type selection drives which default topics, public sites and facebook pages are auto-generated for your site as part of the deployment process.
* Available site types
  * Humanitarian
  * Climate Change
  * Health

## Post Deployment Instructions
* Grab a large cup of coffee as the deployment can take north of an hour to complete.

* Once the deployment has finished, click on the `Manage your resources` (highlighted below). 
![Screenshot of ARM template after successful deployment with highlight of management link to access the newly created resource group](https://user-images.githubusercontent.com/1086421/33331326-4437a7fe-d42f-11e7-8b4a-19b968b4705b.png)

* Select the `Tags` tab in the Azure Portal (highlighted below), point your browser to the site at the `FORTIS_ADMIN_INTERFACE_URL` (also highlighted below). 
![Screenshot of Azure portal with highlight of the Fortis admin site URL accessed via Azure Portal tags](https://user-images.githubusercontent.com/1086421/33331249-1b1ce1f4-d42f-11e7-8341-0100660e9e74.png)

* In the Fortis admin portal, you can now finalize the setup of your Fortis deployment; once you've completed all the admin configuration, your deployment is ready to be used.
![Screenshot showing the Fortis admin interface](https://user-images.githubusercontent.com/1086421/33331562-e9e589be-d42f-11e7-870c-6b758ec2141a.png)
