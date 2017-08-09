package com.microsoft.partnercatalyst.fortis.spark.dba
import java.util.concurrent.ConcurrentHashMap

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, Geofence, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.SparkContext
import com.datastax.spark.connector._
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import scala.compat.java8.FunctionConverters._

@SerialVersionUID(100L)
class CassandraConfigurationManager extends ConfigurationManager with Serializable with Loggable {
  // Note: trusted sources are cached for the lifetime of the configuration manager since in order to update them,
  // streaming must be restarted (and hence the configuration manager would be replaced).
  private lazy val connectorToTrustedSources = new ConcurrentHashMap[String, Seq[String]]()

  override def fetchConnectorConfigs(sparkContext: SparkContext, pipeline: String): List[ConnectorConfig] = {
    def fetchTrustedSources(connectorName: String): Seq[String] = {
      sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.TrustedSourcesName)
        .select("externalsourceid")
        .map(row => row.getString("externalsourceid")).collect()
    }

    val pipelineConfigRows = sparkContext.cassandraTable[CassandraSchema.Table.Stream](CassandraSchema.KeyspaceName,
      CassandraSchema.Table.StreamsName).collect()

    pipelineConfigRows.map(stream => {
      val trustedSources = connectorToTrustedSources.computeIfAbsent(stream.streamfactory, (fetchTrustedSources _).asJava)

      ConnectorConfig(
        stream.streamfactory,
        stream.params +
          (
            "trustedSources" -> trustedSources,
            "streamId" -> stream.streamid
          )
      )

    }).toList
  }

  override def fetchSiteSettings(sparkContext: SparkContext): SiteSettings = {
    val siteSettingRow = sparkContext.cassandraTable[CassandraSchema.Table.SiteSetting](CassandraSchema.KeyspaceName,
      CassandraSchema.Table.SiteSettingsName).collect().headOption

    siteSettingRow match {
      case Some(row) =>
        SiteSettings(
          id = row.id,
          siteName = row.sitename,
          geofence = Geofence(row.geofence(0), row.geofence(1), row.geofence(2), row.geofence(3)),
          languages = row.languages,
          defaultZoom = row.defaultzoom,
          title = row.title,
          logo = row.logo,
          translationSvcToken = row.translationsvctoken,
          cogSpeechSvcToken = row.cogspeechsvctoken,
          cogVisionSvcToken = row.cogvisionsvctoken,
          cogTextSvcToken = row.cogtextsvctoken,
          insertionTime = row.insertionTime
        )
      case None =>
        val ex = new Exception(s"Table '${CassandraSchema.Table.SiteSettingsName}' must have at least 1 entry.")
        logFatalError(ex.getMessage, ex)
        throw ex
    }
  }

  override def fetchWatchlist(sparkContext: SparkContext): Map[String, List[String]] = {
    val langToTermPairRdd = sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.WatchlistName)
      .select("lang_code", "topic", "translations")
      .flatMap(row =>
        (row.getString("lang_code"), row.getString("topic")) :: row.getMap[String, String]("translations").toList
      )
      .mapValues(List(_))
      .reduceByKey(_ ::: _)

    langToTermPairRdd.collectAsMap().toMap
  }

  override def fetchBlacklist(sparkContext: SparkContext): Seq[BlacklistedTerm] = {
    val blacklistRdd = sparkContext.cassandraTable(CassandraSchema.KeyspaceName, CassandraSchema.Table.BlacklistName)
      .select("conjunctivefilter")
      .map(row => BlacklistedTerm(row.getList[String]("conjunctivefilter").toSet))

    blacklistRdd.collect()
  }
}