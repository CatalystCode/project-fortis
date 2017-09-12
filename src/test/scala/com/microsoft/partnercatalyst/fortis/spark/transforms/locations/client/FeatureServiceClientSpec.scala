package com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client

import com.microsoft.partnercatalyst.fortis.spark.dto.{Geofence, Location}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature.{DefaultLatitude, DefaultLongitude, toLocation}
import org.scalatest.FlatSpec

import scala.util.Try

class TestFeatureServiceClient(bboxResponse: String) extends FeatureServiceClient(apiUrlBase = "unittest") {
  override def fetchBboxResponse(geofence: Geofence, layers: Seq[String]): Try[String] = Try(bboxResponse)
}

class FeatureServiceClientSpec extends FlatSpec {
  "The feature service client" should "produce domain objects from the json api response" in {
    val response = new TestFeatureServiceClient(
      """
        |{"features":[
        |  {"id":"wof-1108832169","name":"Ansonia","layer":"microhood"},
        |  {"id":"wof-102061079","name":"Gowanus Heights","layer":"neighbourhood","centroid":[-1.2,3.4]}
        |]}
      """.stripMargin).bbox(null)

    assert(response === Seq(
      FeatureServiceFeature(id = "wof-1108832169", name = "Ansonia", layer = "microhood", centroid = None),
      FeatureServiceFeature(id = "wof-102061079", name = "Gowanus Heights", layer = "neighbourhood", centroid = Some(List(-1.2, 3.4)))
    ))
  }

  it should "handle bad responses" in {
    val response = new TestFeatureServiceClient("""<html>Certainly not json</html>""").bbox(null)

    assert(response.toList.isEmpty)
  }

  it should "convert features to locations" in {
    val feature = FeatureServiceFeature(id = "wof-102061079", name = "Gowanus Heights", layer = "neighbourhood", centroid = None)
    val location = Location(wofId = "wof-102061079", name = "Gowanus Heights", layer = "country", confidence = None, longitude = DefaultLongitude, latitude = DefaultLatitude)
    assert(location == toLocation(feature))
  }

  it should "convert features to locations with centroids" in {
    val feature = FeatureServiceFeature(id = "wof-102061079", name = "Gowanus Heights", layer = "neighbourhood", centroid = Some(List(-1.2, 3.4)))
    val location = Location(wofId = "wof-102061079", name = "Gowanus Heights", layer = "country", confidence = None, longitude = -1.2, latitude = 3.4)
    assert(location == toLocation(feature))
  }
}
