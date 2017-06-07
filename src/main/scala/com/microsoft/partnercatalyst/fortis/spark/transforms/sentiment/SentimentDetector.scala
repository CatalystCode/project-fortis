package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import com.microsoft.partnercatalyst.fortis.spark.logging.Logger

import scala.util.{Failure, Success, Try}

@SerialVersionUID(100L)
class SentimentDetector(
  auth: SentimentDetectorAuth
) extends Serializable with Logger {

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
  val POSITIVE: Double = 1.0
  val NEUTRAL: Double = 0.6
  val NEGATIVE: Double = 0.0
}
