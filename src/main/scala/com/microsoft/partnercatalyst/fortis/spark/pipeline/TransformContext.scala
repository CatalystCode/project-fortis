package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor, PlaceRecognizer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

trait TransformContext {
  val geofence: Geofence
  val placeRecognizer: PlaceRecognizer
  val featureServiceClient: FeatureServiceClient
  val locationsExtractor: LocationsExtractor
  val keywordExtractor: KeywordExtractor
  val imageAnalyzer: ImageAnalyzer
  val languageDetector: LanguageDetector
  val sentimentDetector: SentimentDetector
  val supportedLanguages: Set[String]
}
