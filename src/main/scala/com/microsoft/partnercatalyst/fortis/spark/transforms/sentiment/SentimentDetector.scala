package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider

import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class SentimentDetector(
  modelsProvider: ZipModelsProvider,
  language: Option[String],
  auth: SentimentDetectorAuth

) extends DetectsSentiment {

  private lazy val detectors = language.map(_ => initializeDetectors())

  def detectSentiment(text: String): Option[Double] = {
    if (detectors.isEmpty) {
      return None
    }

    detectors.get.view.map(detector => {
      Try(detector.detectSentiment(text)) match {
        case Success(Some(sentimentScore)) =>
          logDebug(s"Computed sentiment via ${detector.getClass}")
          Some(sentimentScore)
        case Success(None) | Failure(_) =>
          logDebug(s"Unable to compute sentiment via ${detector.getClass}")
          None
      }
    })
    .find(_.isDefined)
    .getOrElse(None)
  }

  protected def initializeDetectors(): Seq[DetectsSentiment] = {
    Seq(new CognitiveServicesSentimentDetector(language.get, auth),
        new WordListSentimentDetector(modelsProvider, language.get))
  }
}

object SentimentDetector extends Enumeration {
  val Positive: Double = 1.0
  val Neutral: Double = 0.6
  val Negative: Double = 0.0
}

trait DetectsSentiment extends Serializable with Loggable {
  def detectSentiment(text: String): Option[Double]
}
