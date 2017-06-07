package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.{File, IOError}
import java.util.concurrent.ConcurrentHashMap

import com.microsoft.partnercatalyst.fortis.spark.transforms.HasZipModels
import com.microsoft.partnercatalyst.fortis.spark.transforms.nlp.Tokenizer.tokenize
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{NEGATIVE, NEUTRAL, POSITIVE}

import scala.io.Source

@SerialVersionUID(100L)
class WordListSentimentDetector(
  modelsSource: Option[String] = None
) extends HasZipModels(modelsSource) {

  @volatile private lazy val wordsCache = new ConcurrentHashMap[String, Set[String]]

  def detectSentiment(text: String, language: String): Option[Double] = {
    try {
      val resourcesDirectory = ensureModelsAreDownloaded(language)
      val words = tokenize(text.toLowerCase)
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
    val cachedWords = Option(wordsCache.get(path))
    cachedWords match {
      case Some(words) =>
        words
      case None =>
        val words = Source.fromFile(path).getLines().map(_.trim).filter(!_.isEmpty).map(_.toLowerCase).toSet
        wordsCache.putIfAbsent(path, words)
        words
    }
  }

  private def join(directory: String, filename: String): String = {
    new File(new File(directory), filename).toString
  }

  override protected def formatModelsDownloadUrl(language: String): String = {
    s"https://fortismodels.blob.core.windows.net/sentiment/sentiment-$language.zip"
  }
}
