# Fortis production setup

## Prerequisites

### Azure subscription

First and foremost, you'll need an Azure subscription. You can create one for
free [here](https://azure.microsoft.com/en-us/free/).

### Azure service principal

You'll need an Azure service principal. You can follow these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal)
if you need to generate a new service principal.

When creating an azure active directory application and assigning the application to a role make sure that you have an `Owner` or `User Access Admin Role`, otherwise you will not be able to assign a role to the application.

During the Azure deployment, the `Application Id` will be used for the `Service Principal App Id` field and the `Authentication Key` will be used for the `Service Principal App Key`.

### TLS setup

If you want to enable TLS to secure your Fortis site, you have two choices:
either providing your own TLS certificate and private key, or automatically
having the service generate a free certificate for you. More detail on
setting up TLS can be found [here](./tls-setup.md).

### Login setup

If you chose either of the two options to configure TLS described above, you will be able to add login via Azure Active Directory v2.0 to regulate access to your Fortis site following these [instructions](./aad-setup.md).

## Setting up a new Azure deployment

Hit the deploy to Azure button below:

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://deploy.azure.com/?repository=https://github.com/catalystcode/project-fortis/tree/master?ptmpl=azuredeploy.parameters.json)

[Fill in the wizard](./azure-deploy-parameters.md) that comes up:

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

Once you've completed all the admin configuration (see below for details), your
deployment is ready to be used.

## Configuring your Fortis site

Project Fortis comes with an admin page with which you can edit site configurations and also provide details on how events should be monitored and processed. Through the admin site, you will be able to configure site settings, blacklist terms, whitelist terms (watchlist), streams (twitter, facebook, etc.), monitored places, and trusted sources.

### Site Settings

Manage service tokens and set up how the site should be displayed.

| Value               | Description          |
| ------------------- | ------------- |
| Site Name           | Used as part of the admin url.  |
| Site Title          | Displayed on the navigation bar.|
| Bounding Box        | By default follows `Who's on First (WOF)`. The format of the WOF bounding box is: `maxY,minX,minY,maxX`. |
| Header Logo Banner  | Image path of banner.  |
| Supported Languages | A comma delimited string with languages formatted as language codes like `en` or `ar`. The admin site can translate to any of the supported languages. For a list of all `supported languages`, you can make a call to [`/GetLanguagesForTranslate`](http://docs.microsofttranslator.com/text-translate.html#!/default/get_GetLanguagesForTranslate), which will return a list of language codes supported by the [Translation Service](http://docs.microsofttranslator.com/text-translate.html).
| Default Language    | The admin site will be displayed in this language. |
| Feature Service     | The feature service namespace. The namespace should be `wof` for whole-world places based on open street maps or `divipola` for detailed Colombia places. More documentation on the feature service [here](https://github.com/CatalystCode/featureService).  |
| Translation Services Token | Needed for real-time text translation. Get a token [here](https://azure.microsoft.com/en-us/services/cognitive-services/translator-text-api).  |
| Cognitive Speech Services Token | Get a token [here](https://azure.microsoft.com/en-us/services/cognitive-services/custom-speech-service/).  |
| Cognitive Vision Services Token | Get a token [here](https://azure.microsoft.com/en-us/services/cognitive-services/custom-vision-service/)  |
| Cognitive Text Services Token | Used for sentiment analysis. Get a token [here](https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/) |

### Watchlist

Manage keywords you would like to monitor. Keywords belong to different categories, which you will define in `watchlist` settings.

| Column Name         | Description   |
| ------------------- | ------------- |
| Category            | Categories are used to classify different keywords into logical groups. |
| name                | Keyword in the site's default language. |
| name_{language}     | Keyword translated to the site's supported language. |

#### Adding Keywords with Excel then Translating them to a Supported Language

To add keywords quickly, you can copy keyword categories and keywords from `excel`, then paste them into the corresponding columns of the watchlist table. To get keyword translations in a supported languages, check the rows you would like translations for and then press the button `translate selection(s)`.

For example, in Excel you may have:

| Category            | Name          |
| ------------------- | ------------- |
| armed conflict      | ammo          |
| armed conflict      | gun           |
| health              | medicine      |

### Event Import

Still needs to be implemented.

### Trusted Sources

Manage trusted sources like `twitter`, `facebook`, etc.

| Column Name         | Description   |
| ------------------- | ------------- |
| Pipeline Key        | Refer to `All Supported Trusted Sources` table below. |
| External Source Id  | Refer to `All Supported Trusted Sources` table below. |
| Category            | The category specifies what set of `watchlist` keywords are monitored in the pipeline for a particular source type. Categories are originally defined in the `watchlist` tab. For example, if the category is `armed conflict` and the source type is `Facebook` for a row in the trusted sources table, then the pipeline will process any facebook events containing keywords in the `armed conflict` category. |
| Name                | Friendly name you assign for your trusted source to act as an alias for the external source id. In the `dashboard` this friendly name will be what is displayed, not the external source id. (external source id will only be displayed if `Name` is not defined) |
| Source Type         | Refer to `All Supported Trusted Sources` table below. | 
| Rank                | An `Integer` value. The `rank` does not affect the way events are processed in the pipeline and does not affect the ui (though the rank feature may be added in the future), but it is still a required field. |  

#### List of All Supported Trusted Sources

A table of all supported `trusted sources` with their associated `pipeline keys` and descriptions of what to put as their `external source ids`. If you would like to add a new trusted source to Fortis you can look in `project-fortis-spark's` `/streamfactories` and `/analyzers` and view their implementations.

| Source Type            | Pipeline Key  | External Source Id |
| ---------------------- | ------------- | ------------------ |
| BingPage               | BingPage      | A bing page url `host` like `nytimes.com`. |
| CustomEvent            | CustomEvent   | You as a user would define its structure. |
| Facebook               | Facebook      | [Facebook Page Id](https://www.facebook.com/help/community/question/?id=378910098941520)   |
| HTML                   | HTML          | A html page url `host` like `nytimes.com`.  |
| Instagram              | Instagram     | An instagram `username`. |
| Radio                  | Radio         | A radio station's `url`. |
| Reddit                 | Reddit        | The author's `username` of the reddit post. |
| RSS                    | RSS           | A RSS feed `url`. | 
| TadaWeb                | TadaWeb       | Tadaweb name. |
| Twitter                | Twitter       | [Twitter Id](http://mytwitterid.com/) |

### Blacklisted Terms

Manage keywords to blacklist in the pipeline. For example, if you have `Trump, Obama, election` in your blacklist, then events containing one or more of these keywords will be filtered in the pipeline and will not be displayed on the ui.

| Column Name         | Description   |
| ------------------- | ------------- |
| Blacklisted Terms   | Enter a grouping of keywords for a blacklist as a comma delimited string: Trump, Obama, election. |
| Is Location | A boolean specifying whether the blacklist should only be only applied to a particular location. |

### Streams

Manage streams by providing parameters like api keys, secrets, etc. needed to connect to trusted sources. For example, suppose you defined a few facebook pages and and twitter users as trusted sources. If you decided not to monitor twitter anymore, you could disable the twitter stream. Also, suppose you got a new api key for facebook, you can update the key here.

| Column Name         | Description   |
| ------------------- | ------------- |
| Status              | Values are either `enabled` or `disabled`. If a stream is disabled, no events will be collected on that stream in the pipeline. |
| Pipeline Key        | Key associated with a pipeline. |
| Params              | Parameters used in different trusted sources like `twitter`, `facebook` etc. For example, for a `twitter` stream, parameters you might have would be `consumer key`, `consumer secret`, `access token key`, `access token secret`. These are formatted as key value pairs. |

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
