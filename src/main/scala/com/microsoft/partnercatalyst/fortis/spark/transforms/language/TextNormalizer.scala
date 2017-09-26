package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import java.util.Locale

/**
  * Because misspellings are common for some stream types, this trait allows for correction/stemming in order to improve
  * lookup or processing of some text [fragments]. Think of this as a simpler version of a java.text.Collator.
  */
trait TextNormalizer {

  def normalizeText(text: String): String

}

object TextNormalizer {

  private val normalizersByLocale: Map[String, TextNormalizer] = Map(
    "es" -> SpanishNormalizer()
  )

  def apply(text: String, locale: String): String = {
    normalizersByLocale.getOrElse(locale, DefaultNormalizer()).normalizeText(text)
  }

}

case class DefaultNormalizer() extends TextNormalizer {
  override def normalizeText(text: String): String = text
}

/**
  * It is quite common, in informal writing, for people to leave out accent marks in Spanish words. So this normalizer
  * strips out diacritics and changes the incoming text to lower case.
  */
case class SpanishNormalizer() extends TextNormalizer {
  val locale = Locale.forLanguageTag("es")
  override def normalizeText(text: String): String = {
    org.apache.commons.lang3.StringUtils.stripAccents(text.toLowerCase(locale))
  }
}
