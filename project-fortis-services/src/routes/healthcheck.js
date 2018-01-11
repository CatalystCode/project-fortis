const cassandraStatus = require('../clients/cassandra/CassandraConnector').status;

function healthcheckHandler(req, res) {
  return res.json({
    cassandraIsInitialized: cassandraStatus.isInitialized
  });
}

module.exports = healthcheckHandler;
