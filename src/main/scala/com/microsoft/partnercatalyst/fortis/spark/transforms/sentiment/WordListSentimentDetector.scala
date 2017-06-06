package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.{File, IOError}

import com.microsoft.partnercatalyst.fortis.spark.transforms.HasZipModels
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{NEGATIVE, NEUTRAL, POSITIVE}

import scala.io.Source

@SerialVersionUID(100L)
class WordListSentimentDetector(
  modelsSource: Option[String] = None
) extends HasZipModels(modelsSource) {
  @transient private lazy val wordTokenizer = """\b""".r

  def detectSentiment(text: String, language: String): Option[Double] = {
    try {
      val resourcesDirectory = ensureModelsAreDownloaded(language)
      val words = wordTokenizer.split(text.toLowerCase)
      val numPositiveWords = countPositiveWords(language, words, resourcesDirectory)
      val numNegativeWords = countNegativeWords(language, words, resourcesDirectory)
      computeSentimentScore(numPositiveWords, numNegativeWords)
    } catch {
      case ex: IOError =>
        logError(s"Unable to extract sentiment for language $language", ex)
        None
    }
  }

  private def computeSentimentScore(numPositiveWords: Int, numNegativeWords: Int) = {
    if (numPositiveWords > numNegativeWords) {
      Some(POSITIVE)
    } else if (numNegativeWords > numPositiveWords) {
      Some(NEGATIVE)
    } else {
      Some(NEUTRAL)
    }
  }

  private def countNegativeWords(language: String, words: Iterable[String], resourcesDirectory: String) = {
    val negativeWords = readWords(join(resourcesDirectory, s"$language-neg.txt"))
    words.count(negativeWords.contains)
  }

  private def countPositiveWords(language: String, words: Iterable[String], resourcesDirectory: String) = {
    val positiveWords = readWords(join(resourcesDirectory, s"$language-pos.txt"))
    words.count(positiveWords.contains)
  }

  private def readWords(path: String): Set[String] = {
    Source.fromFile(path).getLines().map(_.trim).filter(!_.isEmpty).map(_.toLowerCase).toSet
  }

  private def join(directory: String, filename: String): String = {
    new File(new File(directory), filename).toString
  }

  override protected def formatModelsDownloadUrl(language: String): String = {
    s"https://fortismodels.blob.core.windows.net/sentiment/sentiment-$language.zip"
  }
}
