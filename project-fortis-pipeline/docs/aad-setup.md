# Azure Active Directory v2.0 login setup for Fortis

## Pre-deployment steps

### Creating a new AAD application

To configure Azure Active Directory v2.0 (AAD) login, first create a new
application in the [AAD portal](https://apps.dev.microsoft.com/portal/register-app),
ensuring that the "Guided Setup" option is not checked.

![Screenshot showing AAD app registration page](https://user-images.githubusercontent.com/1086421/35748155-04a67f28-081b-11e8-8570-ba730faf6822.png)

Take note of the "Application Id" for your newly created AAD application since
you will require this during the deployment of your Fortis site:

![Screenshot showing AAD Application Id field](https://user-images.githubusercontent.com/1086421/35748987-fb611736-081d-11e8-9c92-b270516160ec.png)

### Configuring permissions

Scroll down to the "Delegated Permissions" section and click "Add":

![Screenshot showing AAD permissions addition button](https://user-images.githubusercontent.com/1086421/35750708-e8233f18-0823-11e8-97c4-850d45cbf152.png)

In the modal, tick the following permissions and then hit "Ok": `email`,
`offline_access`, `openid` and `profile`.

![Screenshot showing AAD permissions choice dialog](https://user-images.githubusercontent.com/1086421/35750713-eb3f1686-0823-11e8-80c4-6911d9cb671b.png)

Verify that the permissions section looks like this and then hit "Save":

![Screenshot showing AAD permissions after being added](https://user-images.githubusercontent.com/1086421/35750716-edaf019c-0823-11e8-8cea-1802a676fb95.png)

## Deployment steps

When deploying your Fortis site, copy the `Application Id` for your newly
created AAD application into the `Active Directory Client Id` field on the
Fortis deployment wizard.

Additionally, the Fortis deployment wizard will present you with two additional
fields: `Fortis Admins` and `Fortis Users`. Enter into these fields the email
addresses for the people who should be granted access to your Fortis site,
separated by commas.

Note that you can manage access permissions after your Fortis site is set up,
in the admin UI, but at the very least add your own email address as an admin
so that you are able to access and configure your Fortis site after the
deployment is complete.

## Post-deployment steps

After your Fortis deployment is done, head back to the [AAD portal](https://apps.dev.microsoft.com/#/appList),
select the application you created earlier and click the "Add Platform" button:

![Screenshot showing AAD app platform configuration](https://user-images.githubusercontent.com/1086421/35748204-2ea71e04-081b-11e8-998b-c62b6bfbe6f7.png)

In the modal, click on the "Web" platform:

![Screenshot showing AAD app web platform configuration](https://user-images.githubusercontent.com/1086421/35748271-77d03444-081b-11e8-99d1-346322037a1d.png)

Now click on "Add URL" next to the "Redirect URLs" section and enter the value
of the `FORTIS_AAD_REDIRECT_URL` deployment tag in the text field:

![Screenshot showing AAD app web platform redirect URL configuration](https://user-images.githubusercontent.com/1086421/35748374-d7df60a8-081b-11e8-960d-0416a1476f61.png)

Scroll to the bottom of the page and hit "Save":

![Screenshot showing AAD app configuration save button](https://user-images.githubusercontent.com/1086421/35748614-9cbabc60-081c-11e8-805d-458f77fe29da.png)

Congratulations, your Fortis site is now protected via Azure Active Directory
v2.0 log-in.
