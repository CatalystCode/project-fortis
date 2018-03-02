package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.datastax.spark.connector.cql.{CassandraConnector, Schema, TableDef}
import com.datastax.spark.connector.writer._
import org.apache.spark.rdd.RDD

import scala.reflect.ClassTag

object CassandraExtensions {
  implicit class CassandraRDD[K, V](val rdd: RDD[(K, V)]) extends AnyVal {
    def deDupValuesByCassandraTable(keyspaceName: String, tableName: String)
      (implicit connector: CassandraConnector = CassandraConnector(rdd.sparkContext), rwf: RowWriterFactory[V], kt: ClassTag[K], vt: ClassTag[V], ord: Ordering[K]): RDD[(K, V)] =
    {
      val tableDef = Schema.tableFromCassandra(connector, keyspaceName, tableName)
      rdd.deDupValuesByCassandraTable(tableDef)
    }

    def deDupValuesByCassandraTable(tableDef: TableDef)
      (implicit rwf: RowWriterFactory[V], kt: ClassTag[K], vt: ClassTag[V], ord: Ordering[K]): RDD[(K, V)] =
    {
      val rowWriter = implicitly[RowWriterFactory[V]].rowWriter(tableDef, tableDef.primaryKey.map(_.ref))
      val primaryKeySize = tableDef.primaryKey.length

      rdd.groupByKey().mapValues(eventRows => {
        eventRows.groupBy(value => {
          // Group by an ordered list of primary key column values.
          // Resulting groups will be rows that would collide. We take 'head' of each group in order to de-dup.
          val buffer = new Array[Any](primaryKeySize)
          rowWriter.readColumnValues(value, buffer)

          buffer.toList
        }).mapValues(_.head).values
      }).flatMap { case (event, uniqueRows) => uniqueRows.map((event, _)) }
    }
  }
}
