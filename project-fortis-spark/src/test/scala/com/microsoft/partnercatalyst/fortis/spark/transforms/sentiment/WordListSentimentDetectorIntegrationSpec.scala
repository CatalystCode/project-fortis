package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import com.microsoft.partnercatalyst.fortis.spark.IntegrationTestSpec
import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{Negative, Neutral, Positive}

class WordListSentimentDetectorIntegrationSpec extends IntegrationTestSpec {
  "The word list sentiment detector" should "download models from blob" in {
    val localModels = checkIfShouldRunWithLocalModels()
    val modelsProvider = new ZipModelsProvider(
      language => s"https://fortiscentral.blob.core.windows.net/sentiment/sentiment-$language.zip",
      localModels)

    val testCases = List(
      ("victoire supérieure véritable siège tuer révolte révolte", "fr", Negative),
      ("erfolgreich unbeschränkt Pflege Zweifel tot angegriffen", "de", Neutral),
      ("libération du quai", "fr", Positive)
    )

    testCases.foreach(test => {
      val detector = new WordListSentimentDetector(modelsProvider, test._2)
      val sentiment = detector.detectSentiment(test._1)
      assert(sentiment.contains(test._3))
    })
  }
}
