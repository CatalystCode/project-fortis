#!/usr/bin/env bash

if ! (command -v az >/dev/null); then echo "Unmet system dependency: az" >&2; exit 1; fi
if ! (command -v python >/dev/null); then echo "Unmet system dependency: python" >&2; exit 1; fi

usage() { echo "Usage: $0 -i <subscriptionId> -g <resourceGroupName> -n <deploymentName> -l <resourceGroupLocation>" >&2; exit 1; }

declare subscriptionId=""
declare resourceGroupName=""
declare deploymentName=""
declare resourceGroupLocation=""

readonly scriptDirectory="$(readlink -f $(dirname $0))"
readonly templateFilePath="$scriptDirectory/template.json"
readonly parametersFilePath="$scriptDirectory/parameters.json"
readonly outputParserScriptPath="$scriptDirectory/parse-output.py"

# initialize parameters specified from command line

while getopts ":i:g:n:l:" arg; do
  case "${arg}" in
    i)
      subscriptionId="${OPTARG}"
      ;;
    g)
      resourceGroupName="${OPTARG}"
      ;;
    n)
      deploymentName="${OPTARG}"
      ;;
    l)
      resourceGroupLocation="${OPTARG}"
      ;;
  esac
done
shift $((OPTIND-1))

if [ ! -f "$templateFilePath" ]; then
  echo "$templateFilePath not found"
  exit 1
fi
if [ ! -f "$parametersFilePath" ]; then
  echo "$parametersFilePath not found"
  exit 1
fi
if [ -z "$subscriptionId" ] || [ -z "$resourceGroupName" ] || [ -z "$deploymentName" ]; then
  echo "Either one of subscriptionId, resourceGroupName, deploymentName is empty"
  usage
fi

# login to azure using your credentials

az account show > /dev/null || az login
az account set --subscription "$subscriptionId"

# create resource group if it doesn't exist

az group create --name "$resourceGroupName" --location "$resourceGroupLocation" > /dev/null || true

# start deployment

az group deployment create --name "$deploymentName" --resource-group "$resourceGroupName" --template-file "$templateFilePath" --parameters "$parametersFilePath" | python "$outputParserScriptPath"
