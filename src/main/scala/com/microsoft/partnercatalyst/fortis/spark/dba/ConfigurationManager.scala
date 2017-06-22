package com.microsoft.partnercatalyst.fortis.spark.dba

import com.microsoft.partnercatalyst.fortis.spark.streamprovider.ConnectorConfig

trait ConfigurationManager {
  def fetchStreamConfiguration(pipeline: String): List[ConnectorConfig]
}
