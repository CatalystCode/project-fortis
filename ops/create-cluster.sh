chmod 752 *.sh

sudo ./create-disk.sh
sudo ./install-deis.sh

git clone https://github.com/CatalystCode/charts.git

sudo ./install-cassandra.sh
sudo ./install-spark.sh
sudo ./install-postgis
#./install-elasticsearch
#./install-kibana