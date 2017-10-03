package com.microsoft.partnercatalyst.fortis.spark.transformcontext

import com.microsoft.partnercatalyst.fortis.spark.FortisSettings
import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.{KeywordExtractor, LuceneKeywordExtractor}

/**
  * Holds the next set of values for the fields of the current transform context. If the value of a field here is
  * empty, then the corresponding field of the transform context during update will be left as is.
  */
private[transformcontext] class Delta private(
  val siteSettings: Option[SiteSettings],
  val langToKeywordExtractor: Option[Map[String, KeywordExtractor]],
  val blacklist: Option[Seq[BlacklistedTerm]],
  val locationsExtractorFactory: Option[LocationsExtractorFactory],
  val imageAnalyzer: Option[ImageAnalyzer],
  val sentimentDetectorAuth: Option[SentimentDetectorAuth]
)

private[transformcontext] object Delta {
  def apply() = new Delta(None, None, None, None, None, None)

  /**
    * Creates a delta against the provided transform context.
    */
  def apply(
    transformContext: TransformContext,
    featureServiceClientUrlBase: String,
    siteSettings: Option[SiteSettings] = None,
    langToWatchlist: Option[Map[String, Seq[String]]] = None,
    blacklist: Option[Seq[BlacklistedTerm]] = None)(implicit settings: FortisSettings): Delta =
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
        siteSettings.get.getGeofence() != transformContext.siteSettings.geofence
        || siteSettings.get.featureservicenamespace != transformContext.siteSettings.featureservicenamespace,
        new LocationsExtractorFactory(
          new FeatureServiceClient(featureServiceClientUrlBase, siteSettings.get.featureservicenamespace),
          siteSettings.get.getAllLanguages(),
          siteSettings.get.getGeofence(),
          maxLocationsDefault = settings.maxLocationsPerEvent
        ).buildLookup()
      ),
      imageAnalyzer = updatedField(
        siteSettings.get.cogvisionsvctoken != transformContext.siteSettings.cogvisionsvctoken
        || siteSettings.get.featureservicenamespace != transformContext.siteSettings.featureservicenamespace,
        new ImageAnalyzer(
          ImageAnalysisAuth(siteSettings.get.cogvisionsvctoken),
          new FeatureServiceClient(featureServiceClientUrlBase, siteSettings.get.featureservicenamespace))
      ),
      sentimentDetectorAuth = updatedField(
        siteSettings.get.cogtextsvctoken != transformContext.siteSettings.cogtextsvctoken,
        SentimentDetectorAuth(siteSettings.get.cogtextsvctoken)
      ),
      langToKeywordExtractor = langToWatchlist.map(
        m => m.transform((lang, terms)=>new LuceneKeywordExtractor(lang, terms, settings.maxKeywordsPerEvent))
      ),
      blacklist = blacklist
    )
  }
}