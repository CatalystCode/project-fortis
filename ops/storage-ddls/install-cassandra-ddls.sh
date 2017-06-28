#!/usr/bin/env bash

cassandra_host="$1"
cassandra_ddl_script="./storage-ddls/cassandra-setup.cql"

echo "Installing CQLSH"
sudo apt-get install python-pip -y
pip install cqlsh
cqlsh --version

echo "Finished. Deploying cassandra ddl objects."
cqlsh "${cassandra_host}" --cqlversion="3.4.2" -f "${cassandra_ddl_script}"