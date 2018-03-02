package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra

import com.datastax.spark.connector.cql._
import com.datastax.spark.connector.types.{DoubleType, IntType, TextType}
import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.{BeforeAndAfter, FlatSpec}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraExtensions._
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraExtensionsTests.TestInstance

class CassandraExtensionsTests extends FlatSpec with BeforeAndAfter {
  private val tableDef = TableDef(
    keyspaceName = "fortis",
    tableName = "test",
    partitionKey = List(
      ColumnDef("a", PartitionKeyColumn, IntType)
    ),
    clusteringColumns = List(
      ColumnDef("b", ClusteringColumn(0), TextType)
    ),

    // Note: regular columns aren't part of Primary Key / uniqueness
    regularColumns = List(
      ColumnDef("c", RegularColumn, DoubleType)
    )
  )

  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _

  before {
    sc = new SparkContext(conf)
  }

  after {
    sc.stop()
  }

  it should "remove duplicates only among pairs with the same key" in {
    val duplicateRow = TestInstance(1, "foo", 1.23)
    val testRdd = sc.makeRDD(Seq(
      ("key1", duplicateRow),
      ("key1", duplicateRow),
      ("key2", duplicateRow),
      ("key2", duplicateRow)
    ))

    val deDupedRdd = testRdd.deDupValuesByCassandraTable(tableDef)
    val rows = deDupedRdd.collect()

    assert(rows.length == 2
      && rows.exists(_._1 == "key1")
      && rows.exists(_._1 == "key2")
    )
  }

  it should "consider duplicates without respect to regular columns (non-primary key)" in {
    val testRdd = sc.makeRDD(Seq(
      ("key", TestInstance(a = 1, b = "foo", 1.23)),
      ("key", TestInstance(a = 1, b = "foo", 4.56))
    ))

    val deDupedRdd = testRdd.deDupValuesByCassandraTable(tableDef)
    val rows = deDupedRdd.collect()

    assert(rows.length == 1)
  }

  it should "handle empty and single-element RDDs" in {
    val emptyRdd = sc.makeRDD[(String, TestInstance)](Seq.empty)
    val testRdd = sc.makeRDD(Seq(("key", TestInstance(a = 1, b = "foo", c = 1.23))))

    assert(emptyRdd.deDupValuesByCassandraTable(tableDef).collect().isEmpty)
    assert(testRdd.deDupValuesByCassandraTable(tableDef).collect().length == 1)
  }
}

object CassandraExtensionsTests {
  private case class TestInstance(a: Int, b: String, c: Double)
}