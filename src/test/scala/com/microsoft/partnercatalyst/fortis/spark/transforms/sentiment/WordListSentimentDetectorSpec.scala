package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.IOException

import com.microsoft.partnercatalyst.fortis.spark.transforms.ZipModelsProvider
import com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment.SentimentDetector.{NEGATIVE, NEUTRAL, POSITIVE}
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
  modelsProvider: ZipModelsProvider = new TestZipModelsProvider
) extends WordListSentimentDetector {

  protected override def readWords(path: String): Set[String] = {
    if (path.contains("pos.txt")) {
      positiveWords
    } else if (path.contains("neg.txt")) {
      negativeWords
    } else {
      throw new IllegalStateException(s"Requested words for unknown path: $path")
    }
  }

  override protected def createModelsProvider(): ZipModelsProvider = modelsProvider
}

class WordListSentimentDetectorSpec extends FlatSpec {
  "The word list sentiment detector" should "compute neutral sentiment if no positive/negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"))
    val sentiment = detector.detectSentiment("foo bar baz", "en")
    assert(sentiment.contains(NEUTRAL))
  }

  it should "compute positive sentiment if more positive words present" in {
    val detector = new TestWordListSentimentDetector(Set("good", "great"), Set("bad", "terrible"))
    val sentiment = detector.detectSentiment("good foo bar baz great good terrible bad", "en")
    assert(sentiment.contains(POSITIVE))
  }

  it should "compute negative sentiment if more negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"))
    val sentiment = detector.detectSentiment("bad good foo bar baz bad", "en")
    assert(sentiment.contains(NEGATIVE))
  }

  it should "compute neutral sentiment if same positive/negative words present" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"))
    val sentiment = detector.detectSentiment("bad good foo bar", "en")
    assert(sentiment.contains(NEUTRAL))
  }

  it should "not compute sentiment when there is an error" in {
    val detector = new TestWordListSentimentDetector(Set("good"), Set("bad"), new ErrorZipModelsProvider)
    val sentiment = detector.detectSentiment("bad good foo bar baz bad", "en")
    assert(sentiment.isEmpty)
  }

  it should "download models from blob" in {
    val detector = new WordListSentimentDetector()
    val frSentiment1 = detector.detectSentiment("victoire supérieure véritable siège tuer révolte révolte", "fr")
    assert(frSentiment1.contains(NEGATIVE))
    val deSentiment = detector.detectSentiment("erfolgreich unbeschränkt Pflege Zweifel tot angegriffen", "de")
    assert(deSentiment.contains(NEUTRAL))
    val frSentiment2 = detector.detectSentiment("libération du quai", "fr")
    assert(frSentiment2.contains(POSITIVE))
  }
}
