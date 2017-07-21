package com.microsoft.partnercatalyst.fortis.spark.analyzer

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.microsoft.partnercatalyst.fortis.spark.dto._
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.ImageAnalyzer
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.LanguageDetector
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.LocationsExtractor
import com.microsoft.partnercatalyst.fortis.spark.transforms.people.PeopleRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector

@SerialVersionUID(100L)
class InstagramAnalyzer extends Analyzer[InstagramItem] with Serializable
  with AnalysisDefaults.EnableBlacklist[InstagramItem]
  with AnalysisDefaults.EnableKeyword[InstagramItem] {
  override def toSchema(item: InstagramItem, locationFetcher: LocationFetcher, imageAnalyzer: ImageAnalyzer): ExtendedDetails[InstagramItem] = {
    val imageAnalysis = imageAnalyzer.analyze(item.images.standard_resolution.url)

    ExtendedDetails(
      eventid = item.id,
      externalsourceid = item.user.username,
      eventtime = item.created_time.toLong,
      body = imageAnalysis.summary.getOrElse(""),
      title = item.caption.text,
      sharedLocations = item.location match {
        case Some(location) => locationFetcher(location.latitude, location.longitude).toList
        case None => List()
      },
      pipelinekey = "Instagram",
      sourceurl = item.link,
      original = item
    )
  }

  override def detectLanguage(details: ExtendedDetails[InstagramItem], languageDetector: LanguageDetector): Option[String] = None
  override def detectSentiment(details: ExtendedDetails[InstagramItem], sentimentDetector: SentimentDetector): List[Double] = List()
  override def extractLocations(details: ExtendedDetails[InstagramItem], locationsExtractor: LocationsExtractor): List[Location] = List()
  override def extractEntities(details: ExtendedDetails[InstagramItem], peopleRecognizer: PeopleRecognizer): List[Tag] = List()
}
