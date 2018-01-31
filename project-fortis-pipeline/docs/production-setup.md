# Fortis production setup

## Prerequisites

* First and foremost, you'll need an Azure subscription. You can create one for
  free [here](https://azure.microsoft.com/en-us/free/).

* Generate an SSH key pair following [these](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)
  instructions. The contents from the generated `MyKey.pub` file will be used
  for the `SSH Public Key` field in the Azure deployment.

* You'll need an Azure service principal. You can follow these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal)
  if you need to generate a new service principal. During the Azure deployment,
  the `Application ID` will be used for the `Service Principal App ID` field
  and the `Authentication Key` will be used for the `Service Principal App Key`.

* You'll need a Mapbox access token. If you don't have one yet, [sign up](https://www.mapbox.com/signup/)
  to create a new token for free.

## Setting up a new Azure deployment

Hit the deploy to Azure button below:

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/project-fortis/tree/master?ptmpl=azuredeploy.parameters.json)

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

For more detailed information on the admin page, refer to this [guide](user/admin.md).
