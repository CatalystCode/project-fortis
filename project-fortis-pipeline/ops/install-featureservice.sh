#!/usr/bin/env bash

readonly featuresdb_name="$1"
readonly k8resource_group="$2"
readonly k8location="$3"
readonly user_name="$4"

readonly dbpassword="$(< /dev/urandom tr -dc '_A-Z-a-z-0-9' | head -c32)"
readonly dbversion="1.0.1"
readonly dbsku="GP_Gen4_2"
readonly dbsizemb="102400"

# setup
readonly install_dir="$(mktemp -d /tmp/fortis-featureservice-XXXXXX)"
readonly namespace_yaml="${install_dir}/kubernetes-namespace.yaml"
readonly deployment_yaml="${install_dir}/kubernetes-deployment.yaml"
readonly service_yaml="${install_dir}/kubernetes-service.yaml"

az postgres server create \
  --name="${featuresdb_name}" \
  --admin-user="${user_name}" \
  --admin-password="${dbpassword}" \
  --resource-group="${k8resource_group}" \
  --location="${k8location}" \
  --sku-name="${dbsku}" \
  --storage-size="${dbsizemb}"

az postgres server firewall-rule create \
  --server-name="${featuresdb_name}" \
  --resource-group="${k8resource_group}" \
  --start-ip-address="0.0.0.0" \
  --end-ip-address="255.255.255.255" \
  --name="AllowAll"

# deploy the featureService to the kubernetes cluster, with internal-only IP
cat > "${namespace_yaml}" << EOF
{
  "kind": "Namespace",
  "apiVersion": "v1",
  "metadata": {
    "name": "featureservice",
    "labels": {
      "name": "featureservice"
    }
  }
}
EOF
cat > "${deployment_yaml}" << EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: featureservice
  creationTimestamp: null
  name: featureservice
  labels:
    io.kompose.service: featureservice
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: featureservice
    spec:
      containers:
      - env:
        - name: FEATURES_DB_USER
          value: ${user_name}@${featuresdb_name}
        - name: FEATURES_DB_PASSWORD
          value: ${dbpassword}
        - name: FEATURES_DB_HOST
          value: ${featuresdb_name}.postgres.database.azure.com
        - name: FEATURES_DB_PORT
          value: "5432"
        - name: FEATURES_DB_NAME
          value: features
        - name: FEATURES_DB_DUMP_URL
          value: https://fortiscentral.blob.core.windows.net/locations/dump.fc.gz
        - name: PORT
          value: "80"
        image: cwolff/featureservice:${dbversion}
        imagePullPolicy: "Always"
        name: featureservice
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
  namespace: featureservice
  creationTimestamp: null
  name: featureservice
  labels:
    io.kompose.service: featureservice
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
spec:
  selector:
    io.kompose.service: featureservice
  ports:
  - name: "80"
    port: 80
    targetPort: 80
status:
  loadBalancer: {}
EOF
kubectl create -f "${namespace_yaml}","${deployment_yaml}","${service_yaml}"
