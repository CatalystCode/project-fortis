./install-disk.sh
./install-deis.sh

git clone https://github.com/CatalystCode/charts.git
cd charts

./install-cassandra.sh
./install-spark
#./install-postgis
#./install-elasticsearch
#./install-kibana