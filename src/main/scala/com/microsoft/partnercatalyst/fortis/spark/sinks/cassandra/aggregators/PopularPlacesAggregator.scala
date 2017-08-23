package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraPopularPlaces
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto._
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

class PopularPlacesAggregator extends FortisAggregatorBase with Serializable{
  private val TargetTableName = "popularplaces"
  private val GroupedBaseColumnNames = Seq("placeid", "periodtype", "period", "conjunctiontopic1", "conjunctiontopic2", "conjunctiontopic3", "periodstartdate", "periodenddate", "centroidlat", "centroidlon")

  private def DetailedAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey", "externalsourceid")
    val SelectClause = GroupedColumns.mkString(",")

      s"SELECT $SelectClause, $AggregateFunctions " +
      s"FROM   $DfTableNameFlattenedEvents " +
      s"GROUP BY $SelectClause"
  }

  private def AllSourcesAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey")
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, 'all' as externalsourceid, $AggregateFunctions " +
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

    s"SELECT a.$SelectClause, " +
    s"       $IncrementalUpdateMentionsUDF, $IncrementalUpdateSentimentUDF " +
    s"FROM   $DfTableNameComputedAggregates a " /*+
    s"LEFT OUTER JOIN $FortisTargetTablename b " +
    s" ON a.pipelinekey = b.pipelinekey and a.placeid = b.placeid " +
    s"    and a.periodtype = b.periodtype and a.period = b.period " +
    s"    and a.externalsourceid = b.externalsourceid and a.conjunctiontopic1 = b.conjunctiontopic1 " +
    s"    and a.conjunctiontopic2 = b.conjunctiontopic2 and a.conjunctiontopic3 = b.conjunctiontopic3 "*/
  }

  override def FortisTargetTablename: String = TargetTableName

  override def FortisTargetTableDataFrame(session: SparkSession): DataFrame = {
    val popularPlacesDF = session.read.format(CassandraFormat)
      .options(Map("keyspace" -> KeyspaceName, "table" -> FortisTargetTablename))
      .load()

    popularPlacesDF
  }
  override def flattenEvents(session: SparkSession, eventDS: Dataset[Event]): DataFrame = {
    import session.implicits._
    eventDS.flatMap(CassandraPopularPlaces(_)).toDF()
  }

  override def IncrementalUpdate(session: SparkSession, aggregatedDS: DataFrame): DataFrame = {
    aggregatedDS.createOrReplaceTempView(FortisTargetTablename)
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

