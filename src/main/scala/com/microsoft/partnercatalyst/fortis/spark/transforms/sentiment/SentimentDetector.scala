package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable

import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class SentimentDetector(
  auth: SentimentDetectorAuth
) extends Serializable with Loggable {

  private lazy val cognitiveServicesSentimentDetector = new CognitiveServicesSentimentDetector(auth)
  private lazy val wordlistSentimentDetector = new WordListSentimentDetector()

  def detectSentiment(text: String, language: String): Option[Double] = {
    val sentiment = Try(cognitiveServicesSentimentDetector.detectSentiment(text, language))
    sentiment match {
      case Success(Some(sentimentScore)) =>
        Some(sentimentScore)
      case Success(None) | Failure(_) =>
        logDebug(s"Unable to compute sentiment via cognitive services, falling back to word-list approach for $language")
        wordlistSentimentDetector.detectSentiment(text, language)
    }
  }
}

object SentimentDetector {
  val Positive: Double = 1.0
  val Neutral: Double = 0.6
  val Negative: Double = 0.0
}
