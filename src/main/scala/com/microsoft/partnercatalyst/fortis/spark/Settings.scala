package com.microsoft.partnercatalyst.fortis.spark

trait Settings {
  val progressDir: String
  val featureServiceHost: String
  val oxfordLanguageToken: String
  val oxfordVisionToken: String
  val appInsightsKey: Option[String]
  val modelsDir: Option[String]
}