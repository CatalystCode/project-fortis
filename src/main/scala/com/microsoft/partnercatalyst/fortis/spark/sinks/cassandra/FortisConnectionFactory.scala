package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.datastax.driver.core.{Cluster, HostDistance, PoolingOptions}
import com.datastax.driver.core.policies.{DCAwareRoundRobinPolicy, TokenAwarePolicy}
import com.datastax.spark.connector.cql.{CassandraConnectionFactory, CassandraConnectorConf, DefaultConnectionFactory}

object FortisConnectionFactory extends CassandraConnectionFactory {
  override def createCluster(conf: CassandraConnectorConf): Cluster = {
    DefaultConnectionFactory
      .clusterBuilder(conf)
      .withLoadBalancingPolicy(
        new TokenAwarePolicy(
          new DCAwareRoundRobinPolicy.Builder().build()
        )
      )
      .withPoolingOptions(poolingOptions)
      .build()
  }

  private def poolingOptions: PoolingOptions = {
    // Reference: http://docs.datastax.com/en/developer/java-driver/3.1/manual/pooling/

    new PoolingOptions()
      // Cassandra binary protocol v3 can support up to 32768 requests per connection.
      .setMaxRequestsPerConnection(HostDistance.LOCAL, 32768)
      .setMaxRequestsPerConnection(HostDistance.REMOTE, 2000)

      // Hold 2 connections at all times per node. Each connection can handle 32768 requests (maxed above). The default
      // is 1 connection per node given high throughput of protocol v3 (we're doubling this).
      .setConnectionsPerHost(HostDistance.LOCAL,  2, 2)
      .setConnectionsPerHost(HostDistance.REMOTE, 2, 2)

      // "The heartbeat interval should be set higher than SocketOptions.readTimeoutMillis: the read timeout is the
      // maximum time that the driver waits for a regular query to complete, therefore the connection should not be
      // considered idle before it has elapsed."
      //
      // Spark connector default for readTimeoutMillis is 2 minutes, while the default here is 30 seconds.
      // We increase this to > 2 min to satisfy above.  TODO: contribute back to DefaultConnectionFactory
      .setHeartbeatIntervalSeconds(120 + 10)

      // Increase max queue size from 256 to 320 to avoid BusyPoolException during high load.
      .setMaxQueueSize(320)
  }
}
