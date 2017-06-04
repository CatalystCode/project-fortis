package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import org.scalatest.FlatSpec

class TestSentimentDetector(cognitiveServicesResponse: String) extends SentimentDetector(SentimentDetectorAuth("key")) {
  protected override def callCognitiveServices(request: String): String = cognitiveServicesResponse
  override def buildRequestBody(text: String, textId: String, language: String): String = super.buildRequestBody(text, textId, language)
}

class SentimentDetectorSpec extends FlatSpec {
  "The sentiment detector" should "formulate correct request and parse response to domain types" in {
    val responseSentiment = 0.8
    val detector = new TestSentimentDetector(s"""{"documents":[{"id":"0","score":$responseSentiment}],"errors":[]}""")
    val sentiment = detector.detectSentiment("some text", "en")

    assert(sentiment.contains(responseSentiment))
  }

  it should "ignore unsupported languages" in {
    val detector = new TestSentimentDetector("""{"documents":[],"errors":[{"id":"0","message":"Supplied language not supported. Pass in one of:en,es,pt,fr,de,it,nl,no,sv,pl,da,fi,ru,el,tr"}]}""")
    val sentiment = detector.detectSentiment("some text", "zh")

    assert(sentiment.isEmpty)
  }

  it should "build correct request body" in {
    val id = "0"
    val language = "en"
    val text = "some text"
    val requestBody = new TestSentimentDetector("").buildRequestBody(text, id, language)

    assert(requestBody == s"""{"documents":[{"id":"$id","text":"$text","language":"en"}]}""")
  }
}
