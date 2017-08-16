package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry
import com.optimaize.langdetect.LanguageDetectorBuilder
import com.optimaize.langdetect.ngram.NgramExtractors
import com.optimaize.langdetect.profiles.LanguageProfileReader
import com.optimaize.langdetect.text.{CommonTextObjectFactories, TextObjectFactory}

@SerialVersionUID(100L)
class LocalLanguageDetector extends LanguageDetector {
  @transient private lazy val languageProfiles = new LanguageProfileReader().readAllBuiltIn
  @transient private lazy val languageDetector = LanguageDetectorBuilder.create(NgramExtractors.standard()).withProfiles(languageProfiles).build()
  @transient private lazy val largeTextFactory = CommonTextObjectFactories.forDetectingOnLargeText()
  @transient private lazy val shortTextFactory = CommonTextObjectFactories.forDetectingShortCleanText()

  override def detectLanguage(text: String): Option[String] = {
    if (text.isEmpty) {
      return None
    }

    var language = detectWithFactory(text, shortTextFactory)
    if (language.isEmpty) language = detectWithFactory(text, largeTextFactory)

    FortisTelemetry.get().logLanguageDetection(language)
    language
  }

  private def detectWithFactory(text: String, factory: TextObjectFactory): Option[String] = {
    Option(languageDetector.detect(factory.forText(text)).orNull).map(_.getLanguage)
  }
}
