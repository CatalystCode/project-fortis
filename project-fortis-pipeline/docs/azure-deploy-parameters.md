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
| Fortis Site Clone Url | Used to scaffold sites locally based off existing site configurations. The `export site` button in the admin page's `site settings` tab will allow you to clone a site and will return a `Fortis Site Clone Url`. | Optional |
| Service Principal App Id | To assign roles to a service principal, you must have either a `Owner` or `User Access Admin Role` in your subscription. Create a [service principal](https://github.com/Azure/acs-engine/blob/e3b22c480c0298b2cf1dce41c4a7e87ac49f46f3/docs/serviceprincipal.md). | Required |
| Service Principal App Key | To assign roles to a service principal, you must have either a `Owner` or `User Access Admin Role` in your subscription. Create a [service principal](https://github.com/Azure/acs-engine/blob/e3b22c480c0298b2cf1dce41c4a7e87ac49f46f3/docs/serviceprincipal.md). | Required |
| Endpoint Protection | Can be `none`, `tls_provide_certificate`, or `tls_lets_encrypt`. </br></br> `none`: TLS will not be set up and your site will not be secure</br>`tls_provide_certificate`: provide your own TLS certificate and private key </br>`tls_lets_encrypt` automatically have the service generate a free certificate for you </br> More details on setting up TLS can be found [here](./tls-setup.md). | Required |
| Active Directory Client Id | Must use `Active Directory v2.0`. To get an AD client id, follow these [instructions](./aad-setup.md). | Required if setting up `TLS` </br></br> Optional for no site authentication |
| Fortis Admins | Formatted as a comma delimited list of emails: `alice@outlook.com,bob@gmail.com,...` </br> Only admins will be allowed to edit site settings, watchlist terms, streams, etc. | Optional |
| Fortis Users | Formatted as a comma delimited list of emails: `alice@outlook.com,bob@gmail.com` </br> Users will not be allowed to edit site settings, watchlist terms, streams, etc, but can view the dashboard and facts pages. | Optional |
| Ingress Hostname | The DNS name for inbound services. Formatted as  `subdomain.host.tld`. For example you could have a ingress hostname like `fortis.mysite.com`. Used for [TLS security](./tls-setup.md). | Required if `Endpoint Protection` is set to either `tls_provide_certificate` or `tls_lets_encrypt`. </br></br> Optional if `Endpoint Protection` is set to `none` |
| TLS Certificate | [More information on TLS Certificate here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#bring-your-own-tls-certificate) | Optional |
| TLS Private Key | [More information on TLS Private Key here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#bring-your-own-tls-certificate) | Optional |
| Lets Encrypt Email | [More information on Lets Encrypt Email here](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/tls-setup.md#letsencrypt-free-certificate) | Required if `Endpoint Protection` is set to `tls_lets_encrypt`. </br></br> Optional otherwise |
| Lets Encrypt Api Endpoint | Defaults to `https://acme-v01.api.letsencrypt.org/directory` | Optional |