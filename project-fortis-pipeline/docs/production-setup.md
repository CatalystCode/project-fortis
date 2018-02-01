# Fortis production setup

## Prerequisites

### Azure subscription

First and foremost, you'll need an Azure subscription. You can create one for
free [here](https://azure.microsoft.com/en-us/free/).

### Azure service principal

You'll need an Azure service principal. You can follow these [instructions](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal)
if you need to generate a new service principal. During the Azure deployment,
the `Application ID` will be used for the `Service Principal App ID` field
and the `Authentication Key` will be used for the `Service Principal App Key`.

### SSH key

Generate an SSH key pair following
[these](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)
instructions. The contents from the generated `MyKey.pub` file will be used
for the `SSH Public Key` field in the Azure deployment.

### Mapbox access token

You'll need a Mapbox access token. If you don't have one yet, [sign up](https://www.mapbox.com/signup/)
to create a new token for free.

### Security

If you want to enable TLS support, you have one of two choices -- providing
your own TLS certificate and private key or using Let's Encrypt. These are
shown in the wizard in the dropdown titled `Endpoint Protection`. There are
three choices `none`, `tls_provide_certificate`, and `tls_lets_encrypt`. You
will need to select one of those vaules. If you select a value other than
`none`, then the `Ingress Hostname` field is required -- this is the hostname
that you will use to access services (and configure TLS for).

#### Bring your own TLS certificate

For providing your own certificate, you select `tls_provide_certificate` from
the `Endpoint Protection` drop down and will need:

1. A TLS certificate and private key which need to be `base64` encoded and
  pasted into the Fortis wizard, shown below. Specifically, the `TLS
  Certificate` and `TLS Private Key` fields.

2. Access to your DNS server to point at the newly provisioned end point.
  This hostname you will need is that defined in the `FORTIS_DNS_NAME` tag (see
  below) and it will need to be pointed at the `FORTIS_DNS_IP` address. It
  should be noted that setting up a DNS A record will vary from provider to
  provider.

#### Let's Encrypt free certificate

For enabling Let's Encrypt support, you select `tls_lets_encrypt` from the
`Endpoint Protection` dropdown and will need to provide the following:

1. The DNS name for inbound services.  This is the `Ingress Hostname` field.

2. An email address that Let's Encrypt can verify the address portion of, for
  instance, if the email is admin@example.com, Let's Encrypt will attempt to
  verify `example.com`. This requires the configuration of either a DNS MX
  record or an A record. How to do this will vary by DNS provider. The value
  that Let's Encrypt will use is exposed in the `FORTIS_MX_RECORD` tag upon
  completion of deployment of Fortis.

3. The Let's Encrypt address to use to request the certificate. Note that,
  the value defaults to the "staging server" for Let's Encrypt which helps for
  development. Change this value to `https://acme-v01.api.letsencrypt.org/directory`
  in the case of a production deployment.

### Login setup

If you chose either of the two options to configure TLS above, you will be able
to add login via Azure Active Directory v2.0 (AAD) to regulate access to your
Fortis site. Note that setting up TLS is required in order to enable login!

To configure AAD, first create a new AAD application [here](https://apps.dev.microsoft.com/portal/register-app).

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
