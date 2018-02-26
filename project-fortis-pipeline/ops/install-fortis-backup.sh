#!/usr/bin/env bash

readonly cassandra_ip="${1}"
readonly cassandra_port="${2}"
readonly cassandra_username="${3}"
readonly cassandra_password="${4}"
readonly storage_account_name="${5}"
readonly storage_account_key="${6}"
readonly fortis_backup_container="${7}"
readonly latest_version="${8}"

# setup
readonly install_dir="$(mktemp -d /tmp/fortis-backup-XXXXXX)"
readonly deployment_yaml="${install_dir}/kubernetes-deployment.yaml"

# deploy the service to the kubernetes cluster
cat > "${deployment_yaml}" << EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  creationTimestamp: null
  name: project-fortis-backup
  labels:
    io.kompose.service: project-fortis-backup
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: project-fortis-backup
    spec:
      containers:
      - env:
        - name: FORTIS_CASSANDRA_HOST
          value: ${cassandra_ip}
        - name: FORTIS_CASSANDRA_PORT
          value: "${cassandra_port}"
        - name: FORTIS_CASSANDRA_USERNAME
          value: ${cassandra_username}
        - name: FORTIS_CASSANDRA_PASSWORD
          value: ${cassandra_password}
        - name: USER_FILES_BLOB_ACCOUNT_NAME
          value: ${storage_account_name}
        - name: USER_FILES_BLOB_ACCOUNT_KEY
          value: ${storage_account_key}
        - name: BACKUP_CONTAINER_NAME
          value: ${fortis_backup_container}
        image: cwolff/project_fortis_backup:${latest_version}
        imagePullPolicy: "Always"
        name: project-fortis-backup
        resources: {}
      restartPolicy: Always
status: {}
EOF
kubectl create -f "${deployment_yaml}"
