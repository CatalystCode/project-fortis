package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import org.scalatest.FlatSpec

class TestLanguageDetector(cognitiveServicesResponse: String) extends LanguageDetector(LanguageDetectorAuth("key")) {
  protected override def callCognitiveServices(request: String): String = cognitiveServicesResponse
  override def buildRequestBody(text: String, textId: String): String = super.buildRequestBody(text, textId)
}

class LanguageDetectorSpec extends FlatSpec {
  "The language detector" should "formulate correct request and parse response to domain types" in {
    val responseConfidence = 1.0
    val detector = new TestLanguageDetector(s"""{"documents":[{"id":"0","detectedLanguages":[{"name":"English","iso6391Name":"en","score":$responseConfidence}]}],"errors":[]}""")
    val language = detector.detectLanguage("some text")

    assert(language.contains("en"))
  }

  it should "ignore low confidence detections" in {
    val responseConfidence = 0.01
    val detector = new TestLanguageDetector(s"""{"documents":[{"id":"0","detectedLanguages":[{"name":"English","iso6391Name":"en","score":$responseConfidence}]}],"errors":[]}""")
    val language = detector.detectLanguage("some text")

    assert(language.isEmpty)
  }

  it should "build correct request body" in {
    val id = "0"
    val text = "some text"
    val requestBody = new TestLanguageDetector("").buildRequestBody(text, id)

    assert(requestBody == s"""{"documents":[{"id":"$id","text":"$text"}]}""")
  }
}
