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
readonly mapbox_access_token="${18}"
readonly cogvisionsvctoken="${19}"
readonly cogspeechsvctoken="${20}"
readonly cogtextsvctoken="${21}"
readonly translationsvctoken="${22}"
readonly fortis_site_clone_url="${23}"
readonly lets_encrypt_email="${24}"
readonly latest_version="${25}"
readonly cassandra_port="${26}"
readonly cassandra_username="${27}"
readonly cassandra_password="${28}"
readonly k8cassandra_node_count="${29}"
readonly tls_hostname="${30}"

# setup
readonly install_dir="$(mktemp -d /tmp/fortis-services-XXXXXX)"
readonly deployment_yaml="${install_dir}/kubernetes-deployment.yaml"
readonly service_yaml="${install_dir}/kubernetes-service.yaml"
readonly ingress_yaml="${install_dir}/nginx-ingress.yaml"
readonly replication_factor="$((k8cassandra_node_count/2+1))"

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
        - name: FORTIS_CASSANDRA_HOST
          value: ${cassandra_ip}
        - name: FORTIS_CASSANDRA_PORT
          value: "${cassandra_port}"
        - name: FORTIS_CASSANDRA_USERNAME
          value: ${cassandra_username}
        - name: FORTIS_CASSANDRA_PASSWORD
          value: ${cassandra_password}
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
        - name: MAPBOX_ACCESS_TOKEN
          value: ${mapbox_access_token}
        - name: COGNITIVE_TEXT_SERVICE_TOKEN
          value: ${cogtextsvctoken}
        - name: COGNITIVE_TRANSLATION_SERVICE_TOKEN
          value: ${translationsvctoken}
        - name: COGNITIVE_SPEECH_SERVICE_TOKEN
          value: ${cogspeechsvctoken}
        - name: COGNITIVE_VISION_SERVICE_TOKEN
          value: ${cogvisionsvctoken}
        - name: FORTIS_CASSANDRA_REPLICATION_FACTOR
          value: "${replication_factor}"
        - name: FORTIS_CASSANDRA_SEED_DATA_URL
          value: ${fortis_site_clone_url}
        - name: FORTIS_CASSANDRA_DATA_SCHEMA_URL
          value: "https://raw.githubusercontent.com/CatalystCode/project-fortis/${latest_version}/project-fortis-pipeline/ops/storage-ddls/cassandra-setup.cql"
        - name: FORTIS_CASSANDRA_SETTINGS_SCHEMA_URL
          value: "https://raw.githubusercontent.com/CatalystCode/project-fortis/${latest_version}/project-fortis-pipeline/ops/storage-ddls/settings-setup.cql"
        image: cwolff/project_fortis_services:${latest_version}
        imagePullPolicy: "Always"
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

# setup kube-lego
helm install --name kube-lego \
  --set config.LEGO_EMAIL="${lets_encrypt_email}" \
  --set config.LEGO_URL="https://acme-v01.api.letsencrypt.org/directory" \
  stable/kube-lego

# setup nginx ingress controller
helm install --name nginx-ingress \
  --set controller.replicaCount=3 \
  --set rbac.create=false \
  --set rbac.createRole=false \
  --set rbac.createClusterRole=false \
  stable/nginx-ingress

cat > "${ingress_yaml}" << EOF
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: project-fortis-services-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    kubernetes.io/tls-acme: "true"
spec:
  rules:
  - host: ${tls_hostname}
    http:
      paths:
      - path: /
        backend:
          serviceName: project-fortis-services
          servicePort: 80
  tls:
  - secretName: project-fortis-services-nginx-tls-secret
    hosts:
      - ${tls_hostname}
EOF
kubectl create -f "${ingress_yaml}"
