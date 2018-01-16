package com.microsoft.partnercatalyst.fortis.spark.transforms.image

import java.lang.System.currentTimeMillis

import com.microsoft.partnercatalyst.fortis.spark.dto.{Analysis, Location, Tag}
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature.toLocation
import net.liftweb.json

import scalaj.http.Http

case class ImageAnalysisAuth(key: String, apiUrlBase: String = "https://westus.api.cognitive.microsoft.com")

@SerialVersionUID(100L)
class ImageAnalyzer(auth: ImageAnalysisAuth, featureServiceClient: FeatureServiceClient) extends Serializable {
  def analyze(imageUrl: String): Analysis = {
    val requestBody = buildRequestBody(imageUrl)
    val response = callCognitiveServices(requestBody)
    parseResponse(response)
  }

  protected def callCognitiveServices(requestBody: String): String = {
    val startTime = currentTimeMillis()
    val response = Http(s"${auth.apiUrlBase}/vision/v1.0/analyze")
      .params(
        "details" -> "Celebrities,Landmarks",
        "visualFeatures" -> "Categories,Tags,Description,Faces")
      .headers(
        "Content-Type" -> "application/json",
        "Ocp-Apim-Subscription-Key" -> auth.key)
      .postData(requestBody)
      .asString

    FortisTelemetry.get.logDependency("transforms.image", "callCognitiveServices", success = response.code == 200, currentTimeMillis() - startTime)
    response.body
  }

  protected def buildRequestBody(imageUrl: String): String = {
    implicit val formats = json.DefaultFormats
    val requestBody = dto.JsonImageAnalysisRequest(url = imageUrl)
    json.compactRender(json.Extraction.decompose(requestBody))
  }

  protected def parseResponse(apiResponse: String): Analysis = {
    implicit val formats = json.DefaultFormats
    val response = json.parse(apiResponse).extract[dto.JsonImageAnalysisResponse]

    Analysis(
      summary = response.description.captions.map(x => x.text).headOption,
      entities = response.categories.flatMap(_.detail.flatMap(_.celebrities)).flatten(x => x).map(x => Tag(x.name, Some(x.confidence))),
      locations = landmarksToLocations(response.categories.flatMap(_.detail.flatMap(_.landmarks)).flatten(x => x)).toList,
      keywords = response.tags.map(x => Tag(x.name, Some(x.confidence))))
  }

  protected def landmarksToLocations(marks: Iterable[dto.JsonImageLandmark]): Iterable[Location] = {
    val landmarks = marks.map(landmark => landmark.name -> landmark.confidence).toMap
    val features = featureServiceClient.name(landmarks.keys)
    features.map(loc => toLocation(loc).copy(confidence = landmarks.get(loc.name)))
  }
}
