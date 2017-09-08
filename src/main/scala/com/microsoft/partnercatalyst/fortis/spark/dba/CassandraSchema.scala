package com.microsoft.partnercatalyst.fortis.spark.dba

object CassandraSchema {
  val KeyspaceName = "fortis"

  object Table {
    val BlacklistName = "blacklist"
    val WatchlistName = "watchlist"
    val SiteSettingsName = "sitesettings"
    val StreamsName = "streams"
    val TrustedSourcesName = "trustedsources"

    case class Stream(
      pipelinekey: String,
      streamid: String,
      params: Map[String, String],
      pipelineicon: String,
      pipelinelabel: String,
      streamfactory: String
    )
  }
}
