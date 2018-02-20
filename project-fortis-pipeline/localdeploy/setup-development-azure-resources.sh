#!/usr/bin/env bash

if ! (command -v az >/dev/null); then echo "Unmet system dependency: az" >&2; exit 1; fi
if ! (command -v python >/dev/null); then echo "Unmet system dependency: python" >&2; exit 1; fi

usage() { echo "Usage: $0 -i <subscriptionId> -l <resourceGroupLocation> -o <outputFile>" >&2; exit 1; }

declare subscriptionId=""
declare resourceGroupLocation=""
declare outputFile=""

readonly scriptDirectory="$(dirname "$0")"
readonly templateFilePath="$scriptDirectory/template.json"
readonly parametersTemplatePath="$scriptDirectory/parameters.json"
readonly outputParserScriptPath="$scriptDirectory/parse-output.py"
readonly parametersFilePath="$(mktemp)"
readonly deployOutputFilePath="$(mktemp)"

cleanup() { rm -f "$parametersFilePath" "$deployOutputFilePath"; }
trap cleanup EXIT

# initialize parameters specified from command line

while getopts ":i:l:o:" arg; do
  case "$arg" in
    i) subscriptionId="$OPTARG" ;;
    l) resourceGroupLocation="$OPTARG" ;;
    o) outputFile="$OPTARG" ;;
  esac
done
shift $((OPTIND-1))

if [ ! -f "$templateFilePath" ]; then echo "$templateFilePath not found" >&2; exit 1; fi
if [ ! -f "$parametersTemplatePath" ]; then echo "$parametersTemplatePath not found" >&2; exit 1; fi
if [ -z "$subscriptionId" ]; then echo "Subscription ID not provided" >&2; usage; fi
if [ -z "$resourceGroupLocation" ]; then echo "Resource group location not provided" >&2; usage; fi
if [ -z "$outputFile" ]; then echo "Output file location not provided" >&2; usage; fi

readonly userName="$(echo "${USER}" | tr -dC 'a-zA-Z')"
readonly personalIdentifier="$userName${RANDOM:0:2}"
readonly resourceGroupName="fortisdev$personalIdentifier$resourceGroupLocation"
readonly deploymentName="fortisdeployment$personalIdentifier$resourceGroupLocation"

# login to azure using your credentials

az account show || az login
az account set --subscription "$subscriptionId"

# create resource group if it doesn't exist

az group create --name "$resourceGroupName" --location "$resourceGroupLocation" || true

# start deployment

sed "s@\"value\": \"fortis@\"value\": \"${personalIdentifier}fortis@g" "$parametersTemplatePath" > "$parametersFilePath"

az group deployment create --name "$deploymentName" --resource-group "$resourceGroupName" --template-file "$templateFilePath" --parameters "$parametersFilePath" | tee "$deployOutputFilePath"

# set up postgres

readonly postgresName="pgsql$personalIdentifier"
readonly postgresUser="$userName"
readonly postgresPassword="$(< /dev/urandom tr -dc '_A-Z-a-z-0-9' | head -c32)"

az postgres server create \
  --name="$postgresName" \
  --admin-user="$postgresUser" \
  --admin-password="$postgresPassword" \
  --resource-group="$resourceGroupName" \
  --location="$resourceGroupLocation" \
  --compute-units="400" \
  --performance-tier="Standard"

az postgres server firewall-rule create \
  --server-name="$postgresName" \
  --resource-group="$resourceGroupName" \
  --start-ip-address="0.0.0.0" \
  --end-ip-address="255.255.255.255" \
  --name="AllowAll"

# save environment variables

echo "FORTIS_RESOURCE_GROUP_NAME=$resourceGroupName" | tee "$outputFile"
echo "FORTIS_RESOURCE_GROUP_LOCATION=$resourceGroupLocation" | tee --append "$outputFile"

echo "FEATURES_DB_USER=$postgresUser@$postgresName" | tee --append "$outputFile"
echo "FEATURES_DB_HOST=$postgresName.postgres.database.azure.com" | tee --append "$outputFile"
echo "FEATURES_DB_PASSWORD=$postgresPassword" | tee --append "$outputFile"

python "$outputParserScriptPath" "$deployOutputFilePath" | tee --append "$outputFile"
