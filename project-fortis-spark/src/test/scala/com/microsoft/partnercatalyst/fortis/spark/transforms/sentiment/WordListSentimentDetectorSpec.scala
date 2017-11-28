package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.IOException

import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{Negative, Neutral, Positive}
import org.scalatest.FlatSpec

class TestZipModelsProvider extends ZipModelsProvider(s => s) {
  override def ensureModelsAreDownloaded(language: String): String = ""
}

class ErrorZipModelsProvider extends ZipModelsProvider(s => s) {
  override def ensureModelsAreDownloaded(language: String): String = throw new IOException()
}

class TestWordListSentimentDetector(
  positiveWords: Set[String],
  negativeWords: Set[String],
  language: String,
  modelsProvider: ZipModelsProvider = new TestZipModelsProvider
) extends WordListSentimentDetector(modelsProvider, language) {

  protected override def readWords(path: String): Set[String] = {
    if (path.endsWith("pos.txt")) {
      positiveWords
    } else if (path.endsWith("neg.txt")) {
      negativeWords
    } else {
      throw new IllegalStateException(s"Requested words for unknown path: $path")
    }
  }
}

class WordListSentimentDetectorSpec extends FlatSpec {
  "The word list sentiment detector" should "compute neutral sentiment if no positive/negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"), "en")
    val sentiment = detector.detectSentiment("foo bar baz")
    assert(sentiment.contains(Neutral))
  }

  it should "compute positive sentiment if more positive words present" in {
    val detector = new TestWordListSentimentDetector(Set("good", "great"), Set("bad", "terrible"), "en")
    val sentiment = detector.detectSentiment("good foo bar baz great good terrible bad")
    assert(sentiment.contains(Positive))
  }

  it should "compute negative sentiment if more negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"), "en")
    val sentiment = detector.detectSentiment("bad good foo bar baz bad")
    assert(sentiment.contains(Negative))
  }

  it should "compute neutral sentiment if same positive/negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"), "en")
    val sentiment = detector.detectSentiment("bad good foo bar")
    assert(sentiment.contains(Neutral))
  }

  it should "not compute sentiment when there is an error" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"), "en", new ErrorZipModelsProvider)
    val sentiment = detector.detectSentiment("bad good foo bar baz bad")
    assert(sentiment.isEmpty)
  }
}
