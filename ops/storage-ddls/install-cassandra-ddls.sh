#!/usr/bin/env bash

cassandra_host="$1"

echo "Installing CQLSH"
apt install python-pip
pip install cqlsh
cqlsh --version

cqlsh ${cassandra_host} -f ./storage-ddls/cassandra-setup.sh