package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

@SerialVersionUID(100L)
class SentimentDetector(
  auth: SentimentDetectorAuth
) extends Serializable {

  private lazy val cognitiveServicesSentimentDetector = new CognitiveServicesSentimentDetector(auth)
  private lazy val wordlistSentimentDetector = new WordListSentimentDetector()

  def detectSentiment(text: String, language: String): Option[Double] = {
    val sentiment = cognitiveServicesSentimentDetector.detectSentiment(text, language)
    sentiment match {
      case Some(_) =>
        sentiment
      case None =>
        wordlistSentimentDetector.detectSentiment(text, language)
    }
  }
}

object SentimentDetector {
  val POSITIVE: Double = 1.0
  val NEUTRAL: Double = 0.6
  val NEGATIVE: Double = 0.0
}
