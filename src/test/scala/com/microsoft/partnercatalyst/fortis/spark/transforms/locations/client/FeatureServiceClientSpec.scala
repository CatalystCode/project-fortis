package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client

import com.microsoft.partnercatalyst.fortis.spark.dto.Geofence
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature
import org.scalatest.FlatSpec

import scala.util.Try

class TestFeatureServiceClient(bboxResponse: String) extends FeatureServiceClient(apiUrlBase = "unittest") {
  override def fetchBboxResponse(geofence: Geofence): Try[String] = Try(bboxResponse)
}

class FeatureServiceClientSpec extends FlatSpec {
  "The feature service client" should "produce domain objects from the json api response" in {
    val response = new TestFeatureServiceClient(
      """
        |{"features":[
        |  {"id":"wof-1108832169","name":"Ansonia","layer":"microhood"},
        |  {"id":"wof-102061079","name":"Gowanus Heights","layer":"neighbourhood"}
        |]}
      """.stripMargin).bbox(null)

    assert(response === Seq(
      FeatureServiceFeature(id = "wof-1108832169", name = "Ansonia", layer = "microhood"),
      FeatureServiceFeature(id = "wof-102061079", name = "Gowanus Heights", layer = "neighbourhood")
    ))
  }

  it should "handle bad responses" in {
    val response = new TestFeatureServiceClient("""<html>Certainly not json</html>""").bbox(null)

    assert(response.toList.isEmpty)
  }
}
