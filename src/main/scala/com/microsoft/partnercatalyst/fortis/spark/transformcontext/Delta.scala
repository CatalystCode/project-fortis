package com.microsoft.partnercatalyst.fortis.spark.transformcontext

import com.microsoft.partnercatalyst.fortis.spark.dto.{BlacklistedTerm, SiteSettings}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.{LanguageDetector, LanguageDetectorAuth}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractorFactory
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetectorAuth

/**
  * Holds the next set of values for the fields of the current transform context. If the value of a field here is
  * empty, then the corresponding field of the transform context during update will be left as is.
  */
private[transformcontext] trait Delta {
  val siteSettings: Option[SiteSettings]
  val langToWatchlist: Option[Map[String, List[String]]]
  val blacklist: Option[List[BlacklistedTerm]]
  val locationsExtractorFactory: Option[LocationsExtractorFactory]
  val imageAnalyzer: Option[ImageAnalyzer]
  val languageDetector: Option[LanguageDetector]
  val sentimentDetectorAuth: Option[SentimentDetectorAuth]
}

private[transformcontext] object Delta {

  private case class DeltaImpl(
    siteSettings: Option[SiteSettings] = None,
    langToWatchlist: Option[Map[String, List[String]]] = None,
    blacklist: Option[List[BlacklistedTerm]] = None,
    locationsExtractorFactory: Option[LocationsExtractorFactory] = None,
    imageAnalyzer: Option[ImageAnalyzer] = None,
    languageDetector: Option[LanguageDetector] = None,
    sentimentDetectorAuth: Option[SentimentDetectorAuth] = None
  ) extends Delta

  /**
    * Creates an empty delta.
    */
  def apply(): Delta = DeltaImpl()

  /**
    * Creates a delta against an empty transform context.
    */
  def apply(
    featureServiceClient: FeatureServiceClient,
    siteSettings: SiteSettings,
    langToWatchlist: Map[String, List[String]],
    blacklist: List[BlacklistedTerm]): Delta =
  {
    buildDelta(None, Some(featureServiceClient), Some(siteSettings), Some(langToWatchlist), Some(blacklist))
  }

  /**
    * Creates a delta against an empty transform context.
    */
  def apply(langToWatchlist: Map[String, List[String]]): Delta =
    buildDelta(null, null, None, Some(langToWatchlist), None)

  /**
    * Creates a delta against an empty transform context.
    */
  def apply(blacklist: List[BlacklistedTerm]): Delta =
    buildDelta(null, null, None, None, Some(blacklist))

  /**
    * Creates a delta against the provided transform context.
    */
  def apply(
    transformContext: TransformContext,
    featureServiceClient: FeatureServiceClient,
    siteSettings: SiteSettings,
    langToWatchlist: Map[String, List[String]],
    blacklist: List[BlacklistedTerm]): Delta =
  {
    buildDelta(Some(transformContext), Some(featureServiceClient), Some(siteSettings), Some(langToWatchlist), Some(blacklist))
  }

  /**
    * Creates a delta against the provided transform context.
    */
  def apply(transformContext: TransformContext, featureServiceClient: FeatureServiceClient, siteSettings: SiteSettings): Delta =
    buildDelta(Some(transformContext), Some(featureServiceClient), Some(siteSettings), None, None)

  /**
    * Builds a delta.
    * @param transformContext The transform context to compute the delta against, or null to assume empty context.
    * @param featureServiceClient The feature service client if applicable or [[None]]
    * @param siteSettingsOpt The updated site settings or [[None]] to ignore.
    * @param langToWatchlistOpt The updated watchlist or [[None]] to ignore.
    * @param blacklistOpt The updated blacklist or [[None]] to ignore.
    * @return
    */
  private def buildDelta(
    transformContext: Option[TransformContext],
    featureServiceClient: Option[FeatureServiceClient],
    siteSettingsOpt: Option[SiteSettings],
    langToWatchlistOpt: Option[Map[String, List[String]]],
    blacklistOpt: Option[List[BlacklistedTerm]]): Delta =
  {
    val settingsDelta = siteSettingsOpt match {
      case Some(settings) => deltaWithSettings(transformContext.orNull, featureServiceClient.orNull, settings)
      case None => DeltaImpl()
    }

    settingsDelta.copy(langToWatchlist = langToWatchlistOpt, blacklist = blacklistOpt)
  }

  /**
    * Builds a delta against the provided transform context using site settings.
    */
  private def deltaWithSettings(transformContext: TransformContext, featureServiceClient: FeatureServiceClient, siteSettings: SiteSettings): DeltaImpl = {
    // Note that parameters are call-by-name
    def updatedField[T](isDirty: => Boolean, newVal: => T): Option[T] = {
      // We resolve 'isDirty' if and only if the transform context is non-null. This allows the expression named by
      // 'isDirty' to assume that the transform context will not be null.
      // When the context is null, we treat the field as dirty since it requires initialization.
      if (transformContext == null || isDirty)
        Some(newVal)
      else
        None
    }

    DeltaImpl(
      siteSettings = Some(siteSettings),
      locationsExtractorFactory = updatedField(
        siteSettings.geofence != transformContext.siteSettings.geofence,
        new LocationsExtractorFactory(featureServiceClient, siteSettings.geofence).buildLookup()
      ),
      imageAnalyzer = updatedField(
        siteSettings.cogVisionSvcToken != transformContext.siteSettings.cogVisionSvcToken,
        new ImageAnalyzer(ImageAnalysisAuth(siteSettings.cogVisionSvcToken), featureServiceClient)
      ),
      languageDetector = updatedField(
        siteSettings.translationSvcToken != transformContext.siteSettings.translationSvcToken,
        new LanguageDetector(LanguageDetectorAuth(siteSettings.translationSvcToken))
      ),
      sentimentDetectorAuth = updatedField(
        siteSettings.translationSvcToken != transformContext.siteSettings.translationSvcToken,
        SentimentDetectorAuth(siteSettings.translationSvcToken)
      )
    )
  }
}