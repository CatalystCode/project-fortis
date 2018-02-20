package com.microsoft.partnercatalyst.fortis.spark.transforms.sentiment

import org.scalatest.FlatSpec

class TestCognitiveServicesSentimentDetector(cognitiveServicesResponse: String, language: String) extends CognitiveServicesSentimentDetector(language, SentimentDetectorAuth("key", "host")) {
  protected override def callCognitiveServices(request: String): String = cognitiveServicesResponse
  override def buildRequestBody(text: String, textId: String): String = super.buildRequestBody(text, textId)
}

class CognitiveServicesSentimentDetectorSpec extends FlatSpec {
  "The sentiment detector" should "formulate correct request and parse response to domain types" in {
    val responseSentiment = 0.8
    val detector = new TestCognitiveServicesSentimentDetector(s"""{"documents":[{"id":"0","score":$responseSentiment}],"errors":[]}""", "en")
    val sentiment = detector.detectSentiment("some text")

    assert(sentiment.contains(responseSentiment))
  }

  it should "ignore unsupported languages" in {
    val detector = new TestCognitiveServicesSentimentDetector("""{"documents":[],"errors":[{"id":"0","message":"Supplied language not supported. Pass in one of:en,es,pt,fr,de,it,nl,no,sv,pl,da,fi,ru,el,tr"}]}""", "zh")
    val sentiment = detector.detectSentiment("some text")

    assert(sentiment.isEmpty)
  }

  it should "build correct request body" in {
    val id = "0"
    val language = "en"
    val text = "some text"
    val requestBody = new TestCognitiveServicesSentimentDetector("", language).buildRequestBody(text, id)

    assert(requestBody == s"""{"documents":[{"id":"$id","text":"$text","language":"en"}]}""")
  }
}
