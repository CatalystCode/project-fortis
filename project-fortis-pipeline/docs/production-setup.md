# Fortis production 

## Prerequisites

### Azure subscription

First and foremost, you'll need an Azure subscription. 

Azure is a comprehensive set of cloud services that developers and IT professionals use to build, deploy, and manage applications through our global network of datacenters. Integrated tools, DevOps, and a marketplace support you in efficiently building anything from simple mobile apps to internet-scale solutions.

A full list of products and services can be found [here](https://azure.microsoft.com/en-us/services/).

And you can create an account for free [here](https://azure.microsoft.com/en-us/free/).

For this project we're using these services: [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), [Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/), [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/services/postgresql/), [Service Bus](https://azure.microsoft.com/en-us/services/service-bus/), [Active Directory v2](https://azure.microsoft.com/en-us/services/active-directory/), [Container Service](https://azure.microsoft.com/en-us/services/container-service/) and [Event Hubs](https://azure.microsoft.com/en-us/services/event-hubs/).

## Setting up a new Azure deployment

Hit the deploy to Azure button below:

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/project-fortis/tree/master?ptmpl=azuredeploy.parameters.json)

[Fill in the wizard](./azure-deploy-parameters.md) that comes up:

![Screenshot of ARM wizard](https://user-images.githubusercontent.com/7635865/27882830-e785819c-6193-11e7-9b27-5fc452f23b1a.png)

Now grab a large cup of coffee as the deployment can take north of an hour to
complete.

## Post Deployment

Remember to do the [AAD post deployment steps](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/aad-setup.md#post-deployment-steps) before viewing your site. Then, click on the `Manage your resources`
(highlighted below).

![Screenshot of ARM template after successful deployment with highlight of management link to access the newly created resource group](https://user-images.githubusercontent.com/1086421/33331326-4437a7fe-d42f-11e7-8b4a-19b968b4705b.png)

Now click on the `Tags` tab in the Azure Portal (highlighted below) and find the
`FORTIS_ADMIN_INTERFACE_URL` (also highlighted below).

![Screenshot of Azure portal with highlight of the Fortis admin site URL accessed via Azure Portal tags](https://user-images.githubusercontent.com/1086421/33331249-1b1ce1f4-d42f-11e7-8341-0100660e9e74.png)

Point your browser to the admin interface URL. Once the Fortis admin portal
loads, you can now finalize the setup of your Fortis deployment using the portal:

![Screenshot showing the Fortis admin interface](https://user-images.githubusercontent.com/1086421/33331562-e9e589be-d42f-11e7-870c-6b758ec2141a.png)

If you get `AADSTS70005: response_type 'id_token' is not enabled for the application`, make sure you completed all the post deployment steps properly.

Once you've completed all the [admin settings](./admin-settings.md), your
deployment is ready to be used.

## Updating your Fortis deployment

As new releases of Fortis get published, you may want to update your deployment
to take advantage of the newest features and improvements. To install a new
version of Fortis, you will have to execute the following command in a Bash
terminal such as the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about):

```sh
ssh fortisadmin@YOUR_DEPLOY_VM_IP "sudo ~/upgrade-fortis.sh RELEASE_TO_INSTALL"
```

The value for `YOUR_DEPLOY_VM_IP` can be found in the resource group into which
you originally deployed your Fortis site. Look for the resource named `fortisDeployPublicIP`
and copy its IP address.

The value for `RELEASE_TO_INSTALL` is the version of Fortis to which you wish to
update. A full list of all supported versions can be found on our [Github releases page](https://github.com/CatalystCode/project-fortis/releases).
