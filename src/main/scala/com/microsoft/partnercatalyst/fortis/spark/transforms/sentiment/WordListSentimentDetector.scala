package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

@SerialVersionUID(100L)
class WordListSentimentDetector(
) extends Serializable {

  def detectSentiment(text: String, language: String): Option[Double] = {
    None
  }
}
