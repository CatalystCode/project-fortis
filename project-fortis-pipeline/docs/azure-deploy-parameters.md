# Azure Deployment Parameters

| Parameter      | Description |           |
| -------------- | ------------| --------- |
| Directory      | Defaults to `Microsoft` | Required  |
| Subscription   | [Get an azure subscription](https://azure.microsoft.com/en-us/free/). | Required |
| Resource Group | Through `deploy to azure`, you may choose an existing resource group, or create a new one. | Required |
| Resource Group Name |       | Required |
| Github Project Parent | Defaults to `CatalystCode`. | Required |
| Github Project Release | Defaults to `master`. | Required |
| Site Name |        | Required |
| Site Location | | Required |
| ACS Master Count | Defaults to `1`. | Required |
| ACS Agent Count  | Defaults to `6`. | Required |
| Agent VM Size    | [Details on VM Sizes](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/sizes). | Required |
| Spark Workers | Defaults to `6`. | Required |
| Cassandra Nodes | Defaults to `5`. | Required |
| Site Type | Populates a site with default `watchlist` terms if `Site Type` is not set to `none`. | Required |
| SSH Public Key | Generate an SSH key pair following [these instructions](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/). The contents of the generated `MyKey.pub` file will be used in this field of your Azure deployment. | Required |
| Mapbox Access Token | If you don't have a token yet, [sign up here](https://www.mapbox.com/signup/) to create a new token for free. | Required |
| Cognitive Services Text Analytics Token | [Obtain a token through these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup). | Optional |
| Cognitive Services Text Translataion Token | [Obtain a token through these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/translator/translator-text-how-to-signup). | Optional |
| Cognitive Services Computer Vision Token | To obtain a key, follow [these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup), but instead search for `computer vision ai` when creating the resource. | Optional |
| Cognitive Services Bing Speech Token | To obtain a key, follow [these instructions](https://docs.microsoft.com/en-us/azure/cognitive-services/text-analytics/how-tos/text-analytics-how-to-signup), but instead search for `bing speech api` when creating the resource. | Optional |
| Fortis Site Clone Url | Used to scaffold sites locally based off existing site configurations. The `export site` button in the admin page's `site settings` tab will allow you to clone a site and will return a `Fortis Site Clone Url`. | Optional |
| Service Principal App Id | [Get a service principal app id](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal). The `Application Id` will be used for this `Service Principal App Id` field. | Required |
| Service Principal App Key | [Get a service principal app id](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal). The `Authentication Key` will be used for this `Service Principal App Key` field. | Required |
| Endpoint Protection | Can be `none`, `tls_provide_certificate`, or `tls_lets_encrypt`. </br></br> `none`: TLS will not be set up and your site will not be secure</br>`tls_provide_certificate`: provide your own TLS certificate and private key </br>`tls_lets_encrypt` automatically have the service generate a free certificate for you </br> More details on setting up TLS can be found [here](./tls-setup.md). | Required |
| Active Directory Client Id | [Get an Active Directory Client Id](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal#get-application-id-and-authentication-key) Copy the `Application Id`, this will be used as your Active Directory Client Id. | Required if setting up `TLS` </br></br> Optional for no site authentication |
| Fortis Admins | Formatted as a comma delimited list of emails: `username@microsoft.com, ...` </br> Only admins will be allowed to edit site settings, watchlist terms, streams, etc. | Optional |
| Fortis Users | Formatted as a comma delimited list of emails: `username@microsoft.com, ...` </br> Users will not be allowed to edit site settings, watchlist terms, streams, etc, but can view the dashboard and facts pages. | Optional |
| Ingress Hostname | The DNS name for inbound services. Formatted as  `subdomain.host.tld`. For example you could have a ingress hostname like `fortis.mysite.com`. Used for [TLS security](./tls-setup.md). | Required if `Endpoint Protection` is set to either `tls_provide_certificate` or `tls_lets_encrypt`. </br></br> Optional if `Endpoint Protection` is set to `none` |
| TLS Certificate | [More information on TLS Certificate here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#bring-your-own-tls-certificate) | Optional |
| TLS Private Key | [More information on TLS Private Key here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#bring-your-own-tls-certificate) | Optional |
| Lets Encrypt Email | [More information on Lets Encrypt Email here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#letsencrypt-free-certificate) | Required if `Endpoint Protection` is set to `tls_lets_encrypt`. </br></br> Optional otherwise |
| Lets Encrypt Api Endpoint | Defaults to `https://acme-v01.api.letsencrypt.org/directory` | Optional |