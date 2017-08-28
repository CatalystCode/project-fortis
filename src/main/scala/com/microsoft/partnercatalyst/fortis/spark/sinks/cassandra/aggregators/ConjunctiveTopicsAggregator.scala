package com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.aggregators
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.CassandraConjunctiveTopics
import com.microsoft.partnercatalyst.fortis.spark.sinks.cassandra.dto.Event
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}

class ConjunctiveTopicsAggregator extends FortisAggregatorBase with Serializable {

  private val GroupedBaseColumnNames = Seq("periodtype", "period", "topic", "conjunctivetopic", "periodstartdate", "periodenddate", "tilex", "tiley", "tilez")

  override def FortisTargetTablename: String = "conjunctivetopics"

  override def FortisTargetTableDataFrame(session: SparkSession): DataFrame = {
    session.read.format(CassandraFormat)
      .options(Map("keyspace" -> KeyspaceName, "table" -> FortisTargetTablename))
      .load()
  }

  override def flattenEvents(session: SparkSession, eventDS: Dataset[Event]): DataFrame = {
    import session.implicits._
    eventDS.flatMap(CassandraConjunctiveTopics(_)).toDF()
  }

  override def IncrementalUpdate(session: SparkSession, aggregatedDS: DataFrame): DataFrame = {
    session.sql(IncrementalUpdateQuery)
  }

  private def IncrementalUpdateQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey", "externalsourceid")
    val SelectClause = GroupedColumns.mkString(",a.")

    s"SELECT a.$SelectClause, $IncrementalUpdateMentionsUDF " +
      s"FROM   $DfTableNameComputedAggregates a "
  }

  override def AggregateEventBatches(session: SparkSession, flattenedEvents: DataFrame): DataFrame = {
    val detailedAggDF = session.sql(DetailedAggregateViewQuery)
    val allSourcesAggDF = session.sql(AllSourcesAggregateViewQuery)
    val allPipelinesAggDF = session.sql(AllPipelineKeysAggregateViewQuery)
    detailedAggDF.union(allSourcesAggDF).union(allPipelinesAggDF)
  }

  private def DetailedAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("pipelinekey", "externalsourceid")
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, sum(mentioncount) as mentioncountagg " +
      s"FROM   $DfTableNameFlattenedEvents " +
      s"GROUP BY $SelectClause"
  }

  private def AllSourcesAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames ++ Seq("externalsourceid")
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, 'all' as pipelinekey, sum(mentioncount) as mentioncountagg " +
      s"FROM   $DfTableNameFlattenedEvents " +
      s"GROUP BY $SelectClause"
  }

  private def AllPipelineKeysAggregateViewQuery: String = {
    val GroupedColumns = GroupedBaseColumnNames
    val SelectClause = GroupedColumns.mkString(",")

    s"SELECT $SelectClause, 'all' as externalsourceid, 'all' as pipelinekey, sum(mentioncount) as mentioncountagg " +
      s"FROM   $DfTableNameFlattenedEvents " +
      s"GROUP BY $SelectClause "
  }
}
