package com.microsoft.partnercatalyst.fortis.spark.transformcontext

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.KeywordExtractor

/**
  * Holds the next set of values for the fields of the current transform context. If the value of a field here is
  * empty, then the corresponding field of the transform context during update will be left as is.
  */
private[transformcontext] class Delta private(
  val siteSettings: Option[SiteSettings],
  val langToKeywordExtractor: Option[Map[String, KeywordExtractor]],
  val blacklist: Option[List[BlacklistedTerm]],
  val locationsExtractorFactory: Option[LocationsExtractorFactory],
  val imageAnalyzer: Option[ImageAnalyzer],
  val languageDetector: Option[LanguageDetector],
  val sentimentDetectorAuth: Option[SentimentDetectorAuth]
)

private[transformcontext] object Delta {
  def apply() = new Delta(None, None, None, None, None, None, None)

  /**
    * Creates a delta against the provided transform context.
    */
  def apply(
    transformContext: TransformContext,
    featureServiceClient: FeatureServiceClient,
    siteSettings: Option[SiteSettings] = None,
    langToWatchlist: Option[Map[String, List[String]]] = None,
    blacklist: Option[List[BlacklistedTerm]] = None): Delta =
  {
    // Note that parameters are call-by-name
    def updatedField[T](isDirty: => Boolean, newVal: => T): Option[T] = {
      siteSettings match {
        case Some(_) =>
          // We resolve 'isDirty' if and only if the transform context's site settings is non-null. This allows the
          // expression named by 'isDirty' to assume that site settings will not be null.
          // When it is null, we treat all fields as dirty since they require initialization.
          if (transformContext.siteSettings == null || isDirty)
            Some(newVal)
          else
            None

        case None => None
      }
    }

    new Delta(
      siteSettings = siteSettings,
      locationsExtractorFactory = updatedField(
        siteSettings.get.geofence != transformContext.siteSettings.geofence,
        new LocationsExtractorFactory(featureServiceClient, siteSettings.get.geofence).buildLookup()
      ),
      imageAnalyzer = updatedField(
        siteSettings.get.cogVisionSvcToken != transformContext.siteSettings.cogVisionSvcToken,
        new ImageAnalyzer(ImageAnalysisAuth(siteSettings.get.cogVisionSvcToken), featureServiceClient)
      ),
      languageDetector = updatedField(
        siteSettings.get.translationSvcToken != transformContext.siteSettings.translationSvcToken,
        new LanguageDetector(LanguageDetectorAuth(siteSettings.get.translationSvcToken))
      ),
      sentimentDetectorAuth = updatedField(
        siteSettings.get.translationSvcToken != transformContext.siteSettings.translationSvcToken,
        SentimentDetectorAuth(siteSettings.get.translationSvcToken)
      ),
      langToKeywordExtractor = langToWatchlist.map(_.mapValues(new KeywordExtractor(_))),
      blacklist = blacklist
    )
  }
}