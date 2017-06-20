package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.microsoft.partnercatalyst.fortis.spark.dto.{AnalyzedItem, FortisItem}
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object InstagramPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]],
    ssc: StreamingContext, transformContext: TransformContext): Option[DStream[FortisItem]] = {
    import transformContext._

    streamProvider.buildStream[InstagramItem](ssc, streamRegistry("instagram")).map(
      stream => stream
        .map(instagram => {
          // do computer vision analysis: keyword extraction, etc.
          val source = instagram.link
          var analysis = imageAnalyzer.analyze(instagram.images.standard_resolution.url)
          analysis = analysis.copy(keywords = keywordExtractor.extractKeywords(instagram.caption.text))
          AnalyzedItem(originalItem = instagram, analysis = analysis, source = source)
        })
        .map(analyzedInstagram => {
          // map tagged locations to location features
          var analyzed = analyzedInstagram
          val instagram = analyzed.originalItem
          if (instagram.location.isDefined) {
            val location = instagram.location.get
            val sharedLocations = locationsExtractor.fetch(latitude = location.latitude, longitude = location.longitude).toList
            analyzed = analyzed.copy(sharedLocations = sharedLocations ++ analyzed.sharedLocations)
          }
          analyzed
        })
    )
  }
}