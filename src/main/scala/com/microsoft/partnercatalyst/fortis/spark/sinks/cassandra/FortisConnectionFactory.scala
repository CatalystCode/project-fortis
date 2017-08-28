package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.datastax.driver.core.Cluster
import com.datastax.driver.core.policies.{DCAwareRoundRobinPolicy, TokenAwarePolicy}
import com.datastax.spark.connector.cql.{CassandraConnectionFactory, CassandraConnectorConf, DefaultConnectionFactory}

object FortisConnectionFactory extends CassandraConnectionFactory {
  override def createCluster(conf: CassandraConnectorConf): Cluster = {
    DefaultConnectionFactory
      .clusterBuilder(conf)
      .withLoadBalancingPolicy(new TokenAwarePolicy(new DCAwareRoundRobinPolicy.Builder().build()))
      .build()
  }
}
