package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import twitter4j.{Status => TwitterStatus}

class TwitterAnalyzer extends Analyzer[TwitterStatus]
  with AnalyzerDefault.EnableAll[TwitterStatus] {
  override def toSchema(item: TwitterStatus, locationsExtractor: LocationsExtractor, imageAnalyzer: ImageAnalyzer): FortisItem = {
    FortisItem(
      body = item.getText,
      title = "",
      source = s"https://twitter.com/statuses/${item.getId}",
      sharedLocations = Option(item.getGeoLocation) match {
        case Some(location) => locationsExtractor.fetch(location.getLatitude, location.getLongitude).toList
        case None => List()
      },
      analysis = Analysis()
    )
  }

  override def detectLanguage(item: AnalyzerItem[TwitterStatus], languageDetector: LanguageDetector): Option[String] = {
    Option(item.original.getLang) match {
      case Some(lang) => Some(lang)
      case None => super.detectLanguage(item, languageDetector)
    }
  }
}