#!/usr/bin/env bash

readonly cassandra_ip="${1}"
readonly app_insights_id="${2}"
readonly feature_service_host="${3}"
readonly eh_conn_str="${4}"
readonly eh_path="${5}"
readonly eh_consumer_group="${6}"
readonly sb_queue_config="${7}"
readonly sb_queue_command="${8}"
readonly fortis_central_directory="${9}"
readonly sb_conn_str="${10}"
readonly storage_account_name="${11}"
readonly storage_account_key="${12}"
readonly fortis_admins="${13}"
readonly fortis_users="${14}"
readonly site_name="${15}"
readonly site_type="${16}"
readonly aad_client="${17}"

# setup
mkdir -p "/tmp/fortis-services"
readonly deployment_yaml="/tmp/fortis-services/kubernetes-deployment.yaml"
readonly service_yaml="/tmp/fortis-services/kubernetes-service.yaml"

# deploy the service to the kubernetes cluster
cat > "${deployment_yaml}" << EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  creationTimestamp: null
  name: project-fortis-services
  labels:
    io.kompose.service: project-fortis-service
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: project-fortis-services
    spec:
      containers:
      - env:
        - name: CASSANDRA_CONTACT_POINTS
          value: ${cassandra_ip}
        - name: APPINSIGHTS_INSTRUMENTATIONKEY
          value: ${app_insights_id}
        - name: FORTIS_FEATURE_SERVICE_HOST
          value: ${feature_service_host}
        - name: FORTIS_CENTRAL_ASSETS_HOST
          value: ${fortis_central_directory}
        - name: PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING
          value: ${eh_conn_str}
        - name: PUBLISH_EVENTS_EVENTHUB_PATH
          value: ${eh_path}
        - name: PUBLISH_EVENTS_EVENTHUB_PARTITION
          value: ${eh_consumer_group}
        - name: FORTIS_SB_CONFIG_QUEUE
          value: ${sb_queue_config}
        - name: FORTIS_SB_COMMAND_QUEUE
          value: ${sb_queue_command}
        - name: FORTIS_SB_CONN_STR
          value: ${sb_conn_str}
        - name: USER_FILES_BLOB_ACCOUNT_NAME
          value: ${storage_account_name}
        - name: USER_FILES_BLOB_ACCOUNT_KEY
          value: ${storage_account_key}
        - name: FORTIS_CASSANDRA_ADMINS
          value: ${fortis_admins}
        - name: FORTIS_CASSANDRA_USERS
          value: ${fortis_users}
        - name: FORTIS_CASSANDRA_SITE_NAME
          value: ${site_name}
        - name: FORTIS_CASSANDRA_SITE_TYPE
          value: ${site_type}
        - name: AD_CLIENT_ID
          value: ${aad_client}
        image: cwolff/project_fortis_services
        name: project-fortis-services
        ports:
        - containerPort: 80
        resources: {}
      restartPolicy: Always
status: {}
EOF
cat > "${service_yaml}" << EOF
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  name: project-fortis-services
  labels:
    io.kompose.service: project-fortis-services
spec:
  selector:
    io.kompose.service: project-fortis-services
  ports:
  - name: "80"
    port: 80
    targetPort: 80
status:
  loadBalancer: {}
EOF
kubectl create -f "${deployment_yaml}","${service_yaml}"

# request a public ip for the service
kubectl expose deployment project-fortis-services \
  --type "LoadBalancer" \
  --name "project-fortis-services-lb"
