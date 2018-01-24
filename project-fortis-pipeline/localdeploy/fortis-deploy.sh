#!/usr/bin/env bash

if ! (command -v az >/dev/null); then echo "Unmet system dependency: az" >&2; exit 1; fi
if ! (command -v python >/dev/null); then echo "Unmet system dependency: python" >&2; exit 1; fi

usage() { echo "Usage: $0 -i <subscriptionId> -l <resourceGroupLocation> -o <outputFile>" >&2; exit 1; }

declare subscriptionId=""
declare resourceGroupLocation=""
declare outputFile=""

readonly scriptDirectory="$(readlink -f "$(dirname "$0")")"
readonly templateFilePath="$scriptDirectory/template.json"
readonly parametersTemplatePath="$scriptDirectory/parameters.json"
readonly outputParserScriptPath="$scriptDirectory/parse-output.py"
readonly parametersFilePath="$(mktemp)"
readonly deployOutputFilePath="$(mktemp)"

cleanup() { rm -f "${parametersFilePath}" "${deployOutputFilePath}"; }
trap cleanup EXIT

# initialize parameters specified from command line

while getopts ":i:l:o:" arg; do
  case "${arg}" in
    i) subscriptionId="${OPTARG}" ;;
    l) resourceGroupLocation="${OPTARG}" ;;
    o) outputFile="${OPTARG}" ;;
  esac
done
shift $((OPTIND-1))

if [ ! -f "$templateFilePath" ]; then echo "$templateFilePath not found" >&2; exit 1; fi
if [ ! -f "$parametersTemplatePath" ]; then echo "$parametersTemplatePath not found" >&2; exit 1; fi
if [ -z "$subscriptionId" ]; then echo "Subscription ID not provided" >&2; usage; fi
if [ -z "$resourceGroupLocation" ]; then echo "Resource group location not provided" >&2; usage; fi
if [ -z "$outputFile" ]; then echo "Output file location not provided" >&2; usage; fi

readonly personalIdentifier="$(echo "${USER}" | tr -dC 'a-zA-Z')${RANDOM:0:2}"
readonly resourceGroupName="fortisdev${personalIdentifier}${resourceGroupLocation}"
readonly deploymentName="fortisdeployment${personalIdentifier}${resourceGroupLocation}"

# login to azure using your credentials

az account show || az login
az account set --subscription "$subscriptionId"

# create resource group if it doesn't exist

az group create --name "$resourceGroupName" --location "$resourceGroupLocation" || true

# start deployment

sed "s@\"value\": \"fortis@\"value\": \"${personalIdentifier}fortis@g" "$parametersTemplatePath" > "${parametersFilePath}"

az group deployment create --name "$deploymentName" --resource-group "$resourceGroupName" --template-file "$templateFilePath" --parameters "$parametersFilePath" | tee "${deployOutputFilePath}"

# save environment variables

echo "FORTIS_RESOURCE_GROUP_NAME=${resourceGroupName}" | tee "${outputFile}"
python "$outputParserScriptPath" "${deployOutputFilePath}" | tee --append "${outputFile}"
