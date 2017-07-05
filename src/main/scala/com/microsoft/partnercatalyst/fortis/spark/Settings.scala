package com.microsoft.partnercatalyst.fortis.spark

trait Settings {
  val progressDir: String
  val featureServiceUrlBase: String
  val oxfordLanguageToken: String
  val oxfordVisionToken: String
  val blobUrlBase: String
  val appInsightsKey: Option[String]
  val modelsDir: Option[String]
}