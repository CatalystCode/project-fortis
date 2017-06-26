#!/usr/bin/env bash

cassandra_host="$1"
cassandra_ddl_script="./storage-ddls/cassandra-setup.cql"

echo "Installing CQLSH"
apt install python-pip
pip install cqlsh
cqlsh --version

cqlsh "${cassandra_host}" -f "${cassandra_ddl_script}"