package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import java.io.IOException

import org.scalatest.FlatSpec

class FakeSentimentDetector(createSentimentScore: () => Option[Double]) extends DetectsSentiment {
  var callCount = 0

  override def detectSentiment(text: String, language: String): Option[Double] = {
    callCount += 1
    createSentimentScore()
  }
}

class TestSentimentDetector(detectors: Seq[DetectsSentiment]) extends SentimentDetector(null) {
  override protected def initializeDetectors(): Seq[DetectsSentiment] = detectors
}

class SentimentDetectorSpec extends FlatSpec {
  "The sentiment detector" should "use the best detector if possible" in {
    val detector1 = new FakeSentimentDetector(() => Some(0.5))
    val detector2 = new FakeSentimentDetector(() => Some(0.4))
    val sentiment = new TestSentimentDetector(Seq(detector1, detector2)).detectSentiment("some text", "en")

    assert(detector1.callCount == 1)
    assert(detector2.callCount == 0)
    assert(sentiment.contains(0.5))
  }

  it should "skip detectors that didn't detect sentiment" in {
    val detector1 = new FakeSentimentDetector(() => None)
    val detector2 = new FakeSentimentDetector(() => None)
    val detector3 = new FakeSentimentDetector(() => Some(0.4))
    val sentiment = new TestSentimentDetector(Seq(detector1, detector2, detector3)).detectSentiment("some text", "en")

    assert(detector1.callCount == 1)
    assert(detector2.callCount == 1)
    assert(detector3.callCount == 1)
    assert(sentiment.contains(0.4))
  }

  it should "skip detectors that errored" in {
    val detector1 = new FakeSentimentDetector(() => throw new IOException())
    val detector2 = new FakeSentimentDetector(() => Some(0.4))
    val detector3 = new FakeSentimentDetector(() => throw new IOException())
    val sentiment = new TestSentimentDetector(Seq(detector1, detector2, detector3)).detectSentiment("some text", "en")

    assert(detector1.callCount == 1)
    assert(detector2.callCount == 1)
    assert(detector3.callCount == 0)
    assert(sentiment.contains(0.4))
  }

  it should "return None if all detectors failed" in {
    val detector1 = new FakeSentimentDetector(() => throw new IOException())
    val detector2 = new FakeSentimentDetector(() => None)
    val detector3 = new FakeSentimentDetector(() => throw new IOException())
    val sentiment = new TestSentimentDetector(Seq(detector1, detector2, detector3)).detectSentiment("some text", "en")

    assert(detector1.callCount == 1)
    assert(detector2.callCount == 1)
    assert(detector3.callCount == 1)
    assert(sentiment.isEmpty)
  }
}
