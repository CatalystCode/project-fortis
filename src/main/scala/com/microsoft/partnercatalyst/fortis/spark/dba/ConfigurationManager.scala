package com.microsoft.partnercatalyst.fortis.spark.dba

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig

trait ConfigurationManager {
  def fetchConnectorConfigs(pipeline: String): List[ConnectorConfig]
  def fetchSiteSettings(): SiteSettings
  def fetchTrustedSources(connector: String): List[String]
  def fetchWatchlist(): Map[String, List[String]]
  def fetchBlacklist(): List[BlacklistedTerm]
}
