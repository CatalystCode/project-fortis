[![Travis CI status](https://api.travis-ci.org/CatalystCode/project-fortis-pipeline.svg?branch=master)](https://travis-ci.org/CatalystCode/project-fortis-pipeline)

# deploy fortis pipeline
Deploy your own Fortis pipeline to an azure subscription through a single click. 

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/fortis-containers/tree/master?ptmpl=azuredeploy.parameters.json)

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
* Once the deployment has finished, click on the `Manage your resources`(highlighted below). 
![image](https://user-images.githubusercontent.com/7635865/27893300-7a5d32c2-61ca-11e7-9413-50a3b125f9f1.png)
* Select the Deployment tab in the Azure Portal, then the `fortis-containers###` deployment and copy the Fortis Admin Interface URL in the output section of the deployment summary. 
![image](https://user-images.githubusercontent.com/7635865/27909039-66951d0a-6214-11e7-998b-be5603c4949b.png)
