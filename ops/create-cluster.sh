./install-disk.sh
./install-deis.sh

git clone https://github.com/CatalystCode/charts.git
cd charts

./install-cassandra.sh
./install-spark.sh
#./install-postgis
#./install-elasticsearch
#./install-kibana