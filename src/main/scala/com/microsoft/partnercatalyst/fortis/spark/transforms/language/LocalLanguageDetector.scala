package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry
import com.optimaize.langdetect.LanguageDetectorBuilder
import com.optimaize.langdetect.ngram.NgramExtractors
import com.optimaize.langdetect.profiles.LanguageProfileReader
import com.optimaize.langdetect.text.CommonTextObjectFactories

@SerialVersionUID(100L)
class LocalLanguageDetector extends LanguageDetector {
  @transient private lazy val languageProfiles = new LanguageProfileReader().readAllBuiltIn
  @transient private lazy val languageDetector = LanguageDetectorBuilder.create(NgramExtractors.standard()).withProfiles(languageProfiles).build()
  @transient private lazy val textObjectFactory = CommonTextObjectFactories.forDetectingOnLargeText()

  override def detectLanguage(text: String): Option[String] = {
    if (text.isEmpty) {
      return None
    }

    val language = Option(languageDetector.detect(textObjectFactory.forText(text)).orNull).map(_.getLanguage)
    FortisTelemetry.get().logLanguageDetection(language)
    language
  }
}
