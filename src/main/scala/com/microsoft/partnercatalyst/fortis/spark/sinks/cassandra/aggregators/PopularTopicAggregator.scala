package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraPopularPlaces, CassandraPopularTopics}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

class PopularTopicAggregator extends FortisAggregatorBase with Serializable{
  private val GroupedBaseColumnNames = Seq("periodtype", "period", "topic", "periodstartdate", "periodenddate", "tilex", "tiley", "tilez")

  private def DetailedAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey", "externalsourceid")
    val SelectClause = GroupedColumns.mkString(",")

      s"SELECT $SelectClause, $AggregateFunctions " +
      s"FROM   $DfTableNameFlattenedEvents " +
      s"GROUP BY $SelectClause"
  }

  private def AllSourcesAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("externalsourceid")
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, 'all' as pipelinekey, $AggregateFunctions " +
    s"FROM   $DfTableNameFlattenedEvents " +
    s"GROUP BY $SelectClause"
  }

  private def AllPipelineKeysAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, 'all' as externalsourceid, 'all' as pipelinekey, $AggregateFunctions " +
    s"FROM   $DfTableNameFlattenedEvents " +
    s"GROUP BY $SelectClause "
  }

  private def IncrementalUpdateQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey", "externalsourceid")
    val SelectClause = GroupedColumns.mkString(",a.")

    s"SELECT a.$SelectClause, $IncrementalUpdateMentionsUDF, $IncrementalUpdateSentimentUDF " +
    s"FROM   $DfTableNameComputedAggregates a "
  }

  override def FortisTargetTablename: String = "populartopics"

  override def FortisTargetTableDataFrame(session: SparkSession): DataFrame = {
    val popularTopicsDF = session.read.format(CassandraFormat)
      .options(Map("keyspace" -> KeyspaceName, "table" -> FortisTargetTablename))
      .load()

    popularTopicsDF
  }

  override def flattenEvents(session: SparkSession, eventDS: Dataset[Event]): DataFrame = {
    import session.implicits._
    eventDS.flatMap(CassandraPopularTopics(_)).toDF()
  }

  override def IncrementalUpdate(session: SparkSession, aggregatedDS: DataFrame): DataFrame = {
    val cassandraSave = session.sql(IncrementalUpdateQuery)

    cassandraSave
  }

  override def AggregateEventBatches(session: SparkSession, flattenedEvents: DataFrame): DataFrame = {
    val detailedAggDF = session.sql(DetailedAggregateViewQuery)
    val allSourcesAggDF = session.sql(AllSourcesAggregateViewQuery)
    val allPipelinesAggDF = session.sql(AllPipelineKeysAggregateViewQuery)
    val unionedResults = detailedAggDF.union(allSourcesAggDF).union(allPipelinesAggDF)

    unionedResults
  }
}
