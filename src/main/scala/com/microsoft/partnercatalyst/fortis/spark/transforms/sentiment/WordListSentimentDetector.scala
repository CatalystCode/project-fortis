package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.IOError

import com.microsoft.partnercatalyst.fortis.spark.transforms.HasZipModels

@SerialVersionUID(100L)
class WordListSentimentDetector(
  modelsSource: Option[String] = None
) extends HasZipModels(modelsSource) {

  def detectSentiment(text: String, language: String): Option[Double] = {
    try {
      val resourcesDirectory = ensureModelsAreDownloaded(language)
      None
    } catch {
      case ex: IOError =>
        logError(s"Unable to extract sentiment for language $language", ex)
        None
    }
  }

  override protected def formatModelsDownloadUrl(language: String): String = {
    s"https://fortismodels.blob.core.windows.net/sentiment/sentiment-$language.zip"
  }
}
