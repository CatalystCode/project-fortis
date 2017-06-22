package com.microsoft.partnercatalyst.fortis.spark.pipeline

import com.github.catalystcode.fortis.spark.streaming.instagram.dto.InstagramItem
import com.microsoft.partnercatalyst.fortis.spark.dto.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.streamprovider.{ConnectorConfig, StreamProvider}
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream

object InstagramPipeline extends Pipeline {
  override def apply(streamProvider: StreamProvider, streamRegistry: Map[String, List[ConnectorConfig]],
    ssc: StreamingContext, transformContext: TransformContext): Option[DStream[AnalyzedItem]] = {
    import transformContext._

    streamProvider.buildStream[InstagramItem](ssc, streamRegistry("instagram")).map(_
      .map(instagram => {
        // do computer vision analysis
        val analysis = imageAnalyzer.analyze(instagram.images.standard_resolution.url)
        AnalyzedItem(
          body = analysis.summary.getOrElse(""),
          title = instagram.caption.text,
          sharedLocations = instagram.location match {
            case Some(location) => locationsExtractor.fetch(location.latitude, location.longitude).toList
            case None => List()},
          analysis = analysis.copy(
            keywords = analysis.keywords.filter(tag => targetKeywords.contains(tag.name))),
          sourceUrl = instagram.link)
      })
      .map(analyzedItem => {
        // keyword extraction
        val keywords = keywordExtractor.extractKeywords(analyzedItem.title) ::: keywordExtractor.extractKeywords(analyzedItem.body)
        analyzedItem.copy(analysis = analyzedItem.analysis.copy(keywords = keywords ::: analyzedItem.analysis.keywords))
      })
      .filter(_.analysis.keywords.nonEmpty))
  }
}