[![Travis CI status](https://api.travis-ci.org/CatalystCode/fortisdeploy.svg?branch=master)](https://travis-ci.org/CatalystCode/fortisdeploy)

# deploy fortis pipeline
Deploy your own Fortis pipeline to an azure subscription through a single click. 

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/fortis-containers/tree/master?ptmpl=azuredeploy.parameters.json)

## Background
Project Fortis is a data ingestion, analysis and visualization pipeline. The pipeline collects social media conversations and postings from the public web and darknet data sources. 

![image](https://user-images.githubusercontent.com/7635865/27882830-e785819c-6193-11e7-9b27-5fc452f23b1a.png)

## Deployment Prerequisite 
* An existing azure subscription. You can create one for free [here](https://azure.microsoft.com/en-us/free/). 
* Generate a Public / Private ssh key pair following [these](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/) instructions. The contents from the generated `MyKey.pub` file will be used for the `SSh Public Key` field. 
* An existing azure service principal. You can create one following these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal). Your service principles `Application ID` will be used for the `Service Principal App ID` field, and the `Authentication Key` will be used for the `Service Principal App Key`. 

## Fortis Monitored Data Sources
* Public Web - Bing
* Reddit
* Twitter
* Facebook
* Instagram
* Radio Broadcasts
* ACLED

## Post Deployment Instructions
* Expect the deployment to run between 30 - 45 minutes, so grab a cup of coffee once you kickoff the deployment. 
* Click on the `Manage your deployment` link once the deployment completes. Select the Deployment tab in the Azure Portal and copy the Fortis Admin Interface URL in the output section of the deployment summary. 