package com.microsoft.partnercatalyst.fortis.spark.transformcontext

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor
import org.apache.spark.broadcast.Broadcast

case class TransformContext(
  siteSettings: SiteSettings = null,
  langToKeywordExtractor: Broadcast[Map[String, KeywordExtractor]] = null,
  blacklist: Broadcast[List[BlacklistedTerm]] = null,
  locationsExtractorFactory: Broadcast[LocationsExtractorFactory] = null,

  // The following objects have a small serialized forms. Consequently, we don't bother to broadcast them
  // (instead, they're serialized into each task that uses them).
  imageAnalyzer: ImageAnalyzer = null,
  languageDetector: LanguageDetector = null,
  sentimentDetectorAuth: SentimentDetectorAuth = null
)