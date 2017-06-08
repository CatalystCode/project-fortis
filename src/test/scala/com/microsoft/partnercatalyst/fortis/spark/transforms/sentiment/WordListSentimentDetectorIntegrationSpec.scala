package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import com.microsoft.partnercatalyst.fortis.spark.IntegrationTestSpec

import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{Negative, Neutral, Positive}

class WordListSentimentDetectorIntegrationSpec extends IntegrationTestSpec {
  "The word list sentiment detector" should "download models from blob" in {
    val localModels = checkIfShouldRunWithLocalModels()

    val detector = new WordListSentimentDetector(localModels)
    val frSentiment1 = detector.detectSentiment("victoire supérieure véritable siège tuer révolte révolte", "fr")
    assert(frSentiment1.contains(Negative))
    val deSentiment = detector.detectSentiment("erfolgreich unbeschränkt Pflege Zweifel tot angegriffen", "de")
    assert(deSentiment.contains(Neutral))
    val frSentiment2 = detector.detectSentiment("libération du quai", "fr")
    assert(frSentiment2.contains(Positive))
  }
}
