package com.microsoft.partnercatalyst.fortis.spark.dba

import java.util.concurrent.ConcurrentHashMap

import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedItem, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import net.liftweb.json
import org.apache.spark.SparkContext

import scala.compat.java8.FunctionConverters._
import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class CassandraConfigurationManager extends ConfigurationManager with Serializable {
  // Note: trusted sources are cached for the lifetime of the configuration manager since in order to update them,
  // streaming must be restarted (and hence the configuration manager would be replaced).
  private lazy val connectorToTrustedSources = new ConcurrentHashMap[String, Seq[String]]()

  override def fetchConnectorConfigs(sparkContext: SparkContext, pipeline: String): List[ConnectorConfig] = {
    def fetchTrustedSources(pipelineKey: String): Seq[String] = {
      sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.TrustedSourcesName)
        .select("externalsourceid")
        .where("pipelinekey = ?", pipelineKey)
        .map(row => row.getString("externalsourceid")).collect()
    }

    val pipelineConfigRows = sparkContext
      .cassandraTable[CassandraSchema.Table.Stream](CassandraSchema.KeyspaceName, CassandraSchema.Table.StreamsName)
      .where("pipelinekey = ?", pipeline)
      .collect()
      .filter(row => row.enabled.getOrElse(true))

    pipelineConfigRows.map(stream => {
      implicit val formats = json.DefaultFormats

      val trustedSources = connectorToTrustedSources.computeIfAbsent(pipeline, (fetchTrustedSources _).asJava)

      val params = Try(json.parse(stream.params_json).extract[Map[String, String]]) match {
        case Failure(ex) =>
          Log.logError("Failed to parse params_json", ex)
          Map[String, String]()
        case Success(map) => map
      }

      ConnectorConfig(
        stream.streamfactory,
        params + ("trustedSources" -> trustedSources, "streamId" -> stream.streamid))
    }).toList
  }

  override def fetchSiteSettings(sparkContext: SparkContext): SiteSettings = {
    val siteSettingRow = sparkContext.cassandraTable[SiteSettings](CassandraSchema.KeyspaceName,
      CassandraSchema.Table.SiteSettingsName).collect().headOption

    siteSettingRow match {
      case Some(row) => row
      case None =>
        val ex = new Exception(s"Table '${CassandraSchema.Table.SiteSettingsName}' must have at least 1 entry.")
        Log.logError(ex.getMessage, ex)
        throw ex
    }
  }

  override def fetchWatchlist(sparkContext: SparkContext): Map[String, List[String]] = {
    val langToTermPairRdd = sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.WatchlistName)
      .select("lang_code", "topic", "translations_json")
      .flatMap(row => {
        implicit val formats = json.DefaultFormats

        val translations = (row.getStringOption("translations_json") match {
          case None => Map[String, String]()
          case Some(jsonString) if jsonString.equals("") => Map[String, String]()
          case Some(jsonString) => Try(json.parse(jsonString).extract[Map[String, String]]) match {
            case Failure(ex) =>
              Log.logError("Failed to parse translations_json", ex)
              Map[String, String]()
            case Success(map) => map
        }}).toList

        (row.getString("lang_code"), row.getString("topic")) :: translations
      })
      .mapValues(List(_))
      .reduceByKey(_ ::: _)

    langToTermPairRdd.collectAsMap().toMap
  }

  override def fetchBlacklist(sparkContext: SparkContext): Seq[BlacklistedItem] = {
    val blacklistRdd = sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.BlacklistName)
      .select("conjunctivefilter_json", "islocation")
      .map(row => {
        implicit val formats = json.DefaultFormats

        val conjunctivefilter = (row.getStringOption("conjunctivefilter_json") match {
          case None => List[String]()
          case Some(jsonString) if jsonString.equals("") => List[String]()
          case Some(jsonString) => Try(json.parse(jsonString).extract[List[String]]) match {
            case Failure(ex) =>
              Log.logError("Failed to parse conjunctivefilter_json", ex)
              List[String]()
            case Success(list) => list
        }}).toSet

        BlacklistedItem(
          conjunctivefilter,
          row.getBooleanOption("islocation").getOrElse(false))
      })

    blacklistRdd.collect()
  }

}
