package com.microsoft.partnercatalyst.fortis.spark.dba

import com.microsoft.partnercatalyst.fortis.spark.dto.SiteSettings
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.ConnectorConfig

trait ConfigurationManager {
  def fetchConnectorConfigs(pipeline: String): List[ConnectorConfig]
  def fetchSiteSettings(): SiteSettings
  def fetchTrustedSources(connector: String): List[String]
}
