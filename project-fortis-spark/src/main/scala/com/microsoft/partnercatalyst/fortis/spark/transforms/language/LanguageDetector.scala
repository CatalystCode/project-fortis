package com.microsoft.partnercatalyst.fortis.spark.transforms.language

trait LanguageDetector extends Serializable {
  def detectLanguage(text: String): Option[String]
}
