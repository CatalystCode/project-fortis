package com.microsoft.partnercatalyst.fortis.spark

object Constants {
  val SparkAppName = "project-fortis-spark"
  val SparkMasterDefault = "local[*]"
  val SparkStreamingBatchSizeDefault = 1

  val EventHubProgressDir = "eventhubProgress"

  object Env {
    val HighlyAvailableProgressDir = "HA_PROGRESS_DIR"
    val AppInsightsKey = "FORTIS_APPINSIGHTS_IKEY"
    val LanguageModelDir = "FORTIS_MODELS_DIRECTORY"
    val FeatureServiceUrlBase = "FORTIS_FEATURE_SERVICE_HOST"
    val OxfordVisionToken= "OXFORD_VISION_TOKEN"
    val OxfordLanguageToken = "OXFORD_LANGUAGE_TOKEN"
    val BlobUrlBase = "FORTIS_BLOB_HOST"
  }
}
