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
| Service Principal User | To assign roles to a service principal, you must have either a `Owner` or `User Access Admin Role` in your subscription. Create a [service principal](https://github.com/Azure/acs-engine/blob/e3b22c480c0298b2cf1dce41c4a7e87ac49f46f3/docs/serviceprincipal.md). | Required |
| Service Principal Password | To assign roles to a service principal, you must have either a `Owner` or `User Access Admin Role` in your subscription. Create a [service principal](https://github.com/Azure/acs-engine/blob/e3b22c480c0298b2cf1dce41c4a7e87ac49f46f3/docs/serviceprincipal.md). | Required |
| Active Directory Client Id | Must use `Active Directory v2.0`. To get an AD client id, follow these [instructions](./aad-setup.md). | Required |
| Fortis Admins | Formatted as a comma delimited list of emails: `alice@outlook.com,bob@gmail.com,...` </br> Only admins will be allowed to edit site settings, watchlist terms, streams, etc. | Required |
| Fortis Users | Formatted as a comma delimited list of emails: `alice@outlook.com,bob@gmail.com` </br> Users will not be allowed to edit site settings, watchlist terms, streams, etc, but can view the dashboard and facts pages. If you wish to enable anyone to access your Fortis site, add the user `anonymous@fortis` here. | Optional |
| Lets Encrypt Email | Contact email address for deployment owner to register with Let's Encrypt | Required |