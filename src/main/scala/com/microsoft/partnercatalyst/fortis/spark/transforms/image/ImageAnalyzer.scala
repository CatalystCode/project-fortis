package com.microsoft.partnercatalyst.fortis.spark.transforms.image

import com.microsoft.partnercatalyst.fortis.spark.transforms.image.dto.{ImageAnalysis, JsonImageAnalysisResponse, Tag}
import net.liftweb.json

import scala.language.reflectiveCalls
import scalaj.http.Http

case class Auth(key: String, apiHost: String = "westus.api.cognitive.microsoft.com")

@SerialVersionUID(100L)
class ImageAnalyzer(auth: Auth) extends Serializable {
  def analyze(imageUrl: String): ImageAnalysis = {
    val response =
      Http(s"https://${auth.apiHost}/vision/v1.0/analyze")
      .params(
        "details" -> "Celebrities,Landmarks",
        "visualFeatures" -> "Categories,Tags,Description,Faces")
      .headers(
        "Content-Type" -> "application/json",
        "Ocp-Apim-Subscription-Key" -> auth.key)
      .postData("{\"url\":\"" + imageUrl + "\"}")
      .asString

    parseResponse(response.body)
  }

  protected def parseResponse(apiResponse: String): ImageAnalysis = {
    implicit val formats = json.DefaultFormats
    val response = json.parse(apiResponse).extract[JsonImageAnalysisResponse]

    ImageAnalysis(
      description = response.description.captions.map(x => x.text).headOption,
      celebrities = response.categories.flatMap(_.detail.flatMap(_.celebrities)).flatten(x => x).map(x => Tag(x.name, x.confidence)),
      landmarks = response.categories.flatMap(_.detail.flatMap(_.landmarks)).flatten(x => x).map(x => Tag(x.name, x.confidence)),
      tags = response.tags.map(x => Tag(x.name, x.confidence)))
  }
}
