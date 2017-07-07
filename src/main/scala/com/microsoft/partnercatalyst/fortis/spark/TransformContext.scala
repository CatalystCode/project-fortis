package com.microsoft.partnercatalyst.fortis.spark

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth
import org.apache.spark.broadcast.Broadcast

case class TransformContext(
  siteSettings: SiteSettings = null,
  langToWatchlist: Broadcast[Map[String, List[String]]] = null,
  blacklist: Broadcast[List[BlacklistedTerm]] = null,
  locationsExtractorFactory: LocationsExtractorFactory = null,
  imageAnalyzer: ImageAnalyzer = null,
  languageDetector: LanguageDetector = null,
  sentimentDetectorAuth: SentimentDetectorAuth = null
)