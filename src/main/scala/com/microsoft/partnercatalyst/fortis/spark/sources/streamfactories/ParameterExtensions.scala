package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

object ParameterExtensions {
  implicit class Parameters(val bag: Map[String, Any]) extends AnyVal {
    def getAs[T](key: String): T = bag(key).asInstanceOf[T]
    def getTrustedSources: Seq[String] = bag("trustedSources").asInstanceOf[Seq[String]]
  }
}
