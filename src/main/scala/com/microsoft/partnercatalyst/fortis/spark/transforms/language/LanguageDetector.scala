package com.microsoft.partnercatalyst.fortis.spark.transforms.language

import net.liftweb.json

import scalaj.http.Http

case class LanguageDetectorAuth(key: String, apiHost: String = "westus.api.cognitive.microsoft.com")

@SerialVersionUID(100L)
class LanguageDetector(
  auth: LanguageDetectorAuth,
  minConfidence: Double = 0.75
) extends Serializable {

  def detectLanguage(text: String): Option[String] = {
    if (text.isEmpty) {
      return None
    }

    val textId = "0"
    val requestBody = buildRequestBody(text, textId)
    val response = callCognitiveServices(requestBody)
    parseResponse(response, textId)
  }

  protected def callCognitiveServices(requestBody: String): String = {
    Http(s"https://${auth.apiHost}/text/analytics/v2.0/languages")
      .params(
        "numberOfLanguagesToDetect" -> "1")
      .headers(
        "Content-Type" -> "application/json",
        "Ocp-Apim-Subscription-Key" -> auth.key)
      .timeout(connTimeoutMs = 2500, readTimeoutMs = 2500)
      .postData(requestBody)
      .asString
      .body
  }

  protected def buildRequestBody(text: String, textId: String): String = {
    implicit val formats = json.DefaultFormats
    val requestBody = dto.JsonLanguageDetectionRequest(documents = List(dto.JsonLanguageDetectionRequestItem(id = textId, text = text)))
    json.compactRender(json.Extraction.decompose(requestBody))
  }

  protected def parseResponse(apiResponse: String, textId: String): Option[String] = {
    implicit val formats = json.DefaultFormats
    val response = json.parse(apiResponse).extract[dto.JsonLanguageDetectionResponse]
    val language = response.documents.find(_.id == textId).map(_.detectedLanguages).getOrElse(List()).headOption

    if (language.isEmpty || language.get.score < minConfidence) {
      None
    } else {
      Some(language.get.iso6391Name)
    }
  }
}
