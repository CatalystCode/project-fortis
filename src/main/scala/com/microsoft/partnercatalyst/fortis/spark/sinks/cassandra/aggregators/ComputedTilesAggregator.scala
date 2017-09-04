package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators

import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.{CassandraComputedTiles, CassandraPopularPlaces, CassandraPopularTopics}
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.{ComputedTile, Event}
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

class ComputedTilesAggregator extends FortisAggregatorBase with Serializable {
  private val TargetTableName = "computedtiles"
  private val GroupedBaseColumnNames = Seq("periodtype", "period", "conjunctiontopic1", "conjunctiontopic2", "conjunctiontopic3", "periodstartdate", "periodenddate", "tilex", "tiley", "tilez", "pipelinekey", "externalsourceid")
  private val SelectableColumnNames = Seq("periodtype", "period", "conjunctiontopic1", "conjunctiontopic2", "conjunctiontopic3", "periodstartdate", "periodenddate", "tilex", "tiley", "tilez")
  private val ExternalSourceColumnName = "externalsourceid"
  private val PipelineKeyColumnName = "pipelinekey"
  private val DetailTileIdColumnName = "detailtileid"

  private def ParseColumnSelect(column: String, display: Boolean): String = {
    if (display) {
      column
    } else {
      s"'all' as ${column}"
    }
  }

  private def DetailedTileAggregateViewQuery(includeExternalSource: Boolean, includePipelinekey: Boolean): String = {
    val SelectClause = (SelectableColumnNames ++ Seq(ParseColumnSelect(PipelineKeyColumnName, includePipelinekey), ParseColumnSelect(ExternalSourceColumnName, includeExternalSource), DetailTileIdColumnName)).mkString(",")
    val GroupedColumns =  (GroupedBaseColumnNames ++ Seq(DetailTileIdColumnName)).mkString(",")

    s"SELECT $SelectClause, $AggregateFunctions " +
    s"FROM $DfTableNameFlattenedEvents " +
    s"GROUP BY $GroupedColumns"
  }

  private def ParentTileAggregateViewQuery(sourceTablename: String, includeExternalSource: Boolean, includePipelinekey: Boolean): String = {
    val SelectClause = (SelectableColumnNames ++ Seq(ParseColumnSelect(PipelineKeyColumnName, includePipelinekey), ParseColumnSelect(ExternalSourceColumnName, includeExternalSource))).mkString(",")
    val GroupedColumns =  (GroupedBaseColumnNames ++ Seq(DetailTileIdColumnName)).mkString(",")

    s"SELECT $SelectClause, sum(mentioncountagg) as mentioncountagg, " +
    s"     SentimentWeightedAvg(IF(IsNull(avgsentimentagg), 0, avgsentimentagg), IF(IsNull(mentioncountagg), 0, mentioncountagg)) as avgsentimentagg, " +
    s"     collect_list(struct(${DetailTileIdColumnName}, mentioncountagg, avgsentimentagg)) as heatmap " +
    s"FROM $sourceTablename " +
    s"GROUP BY $GroupedColumns"
  }

  private def IncrementalUpdateQuery: String = {
    val SelectClause = GroupedBaseColumnNames.mkString(",a.")

    //todo generalize SumMentions function. Blocked until JC merges his conjunctive agg work
    s"SELECT a.$SelectClause, SumMentions(a.mentioncountagg, IF(IsNull(b.mentioncount), 0, b.mentioncount)) as mentioncount, " +
    s"                        SumMentions(MeanAverage(a.avgsentimentagg, a.mentioncountagg), IF(IsNull(b.avgsentimentnumerator), 0, b.avgsentimentnumerator)) as avgsentimentnumerator, " +
    s"       MergeHeatMap(a.heatmap, IF(IsNull(b.heatmap), '{}', b.heatmap)) as heatmap " +
    s"FROM   $DfTableNameComputedAggregates a " +
    s"LEFT OUTER JOIN $FortisTargetTablename b " +
    s" ON a.pipelinekey = b.pipelinekey and a.periodtype = b.periodtype and a.period = b.period " +
    s"    and a.externalsourceid = b.externalsourceid and a.conjunctiontopic1 = b.conjunctiontopic1 " +
    s"    and a.conjunctiontopic2 = b.conjunctiontopic2 and a.conjunctiontopic3 = b.conjunctiontopic3 " +
    s"    and a.tilex = b.tilex and a.tiley = b.tiley and a.tilez = b.tilez and a.pipelinekey = b.pipelinekey " +
    s"    and a.externalsourceid = b.externalsourceid"
  }

  override def FortisTargetTablename: String = TargetTableName

  override def flattenEvents(session: SparkSession, eventDS: Dataset[Event]): DataFrame = {
    import session.implicits._
    eventDS.flatMap(e=>Seq(
      e,
      e.copy(externalsourceid = "all"),
      e.copy(pipelinekey = "all", externalsourceid = "all")
    )).flatMap(CassandraComputedTiles(_)).toDF()
  }

  override def IncrementalUpdate(session: SparkSession, aggregatedDS: DataFrame): DataFrame = {
    val computedTilesSourceDF = session.read.format(CassandraFormat)
      .options(Map("keyspace" -> KeyspaceName, "table" -> FortisTargetTablename))
      .load()

    computedTilesSourceDF.createOrReplaceTempView(FortisTargetTablename)
    val cassandraSave = session.sql(IncrementalUpdateQuery)

    cassandraSave
  }

  private def AggregateComputedTiles(session: SparkSession, sourceTablename: String, includeExternalSource: Boolean, includePipelinekey: Boolean): DataFrame = {
    val detailedTileAggDF = session.sql(DetailedTileAggregateViewQuery(includeExternalSource, includePipelinekey))
    detailedTileAggDF.createOrReplaceTempView(sourceTablename)
    val parentTileAggDF = session.sql(ParentTileAggregateViewQuery(sourceTablename, includeExternalSource, includePipelinekey))

    parentTileAggDF
  }

  override def AggregateEventBatches(session: SparkSession, flattenedEvents: DataFrame): DataFrame = {
    AggregateComputedTiles(session=session, sourceTablename="detailedTileView", includeExternalSource=true, includePipelinekey=true)
  }
}