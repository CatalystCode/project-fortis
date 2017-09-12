package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.dto.{Geofence, Location}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature
import org.scalatest.FlatSpec

object LocationsExtractorSpec {
  val idNyc = "wof-1234"
  val idManhattan = "wof-5678"
  val latNyc = 123
  val lngNyc = 456
  val latManhattan = 78
  val lngManhattan = 90

  val testLookup = Map(
    "nyc" -> Set(Location(idNyc, name = "nyc", latitude = latNyc, longitude = lngNyc, layer = "city")),
    "ny" -> Set(Location(idNyc, name = "ny", latitude = latNyc, longitude = lngNyc, layer = "city")),
    "new york" -> Set(Location(idNyc, name = "new york", latitude = latNyc, longitude = lngNyc, layer = "city")),
    "big apple" -> Set(Location(idManhattan, name = "big apple", latitude = latManhattan, longitude = lngManhattan, layer = "city")),
    "manhattan" -> Set(Location(idManhattan, name = "manhattan", latitude = latManhattan, longitude = lngManhattan, layer = "city"))
  )
}

class TestLocationsExtractorFactory(client: FeatureServiceClient) extends LocationsExtractorFactory(client, geofence = null) {
  def getLookup: Map[String, Set[Location]] = lookup
}

class TestFeatureServiceClient(givenBbox: Seq[FeatureServiceFeature], givenPoint: Seq[FeatureServiceFeature]) extends FeatureServiceClient("http://some/test/url") {
  override def bbox(geofence: Geofence, layers: Seq[String] = List()): Iterable[FeatureServiceFeature] = givenBbox
  override def point(latitude: Double, longitude: Double): Iterable[FeatureServiceFeature] = givenPoint
}

class LocationsExtractorSpec extends FlatSpec {
  "The locations extractor" should "extract single location from text" in {
    val sentence = "Went to New York last week. It was wonderful."
    val extractor = new LocationsExtractor(LocationsExtractorSpec.testLookup, null)
    val locations = extractor.analyze(sentence).map(_.wofId).toSet
    assert(locations == Set(LocationsExtractorSpec.idNyc))
  }

  it should "extract multiple locations from text" in {
    val sentence = "Manhattan is located in NYC, New York."
    val extractor = new LocationsExtractor(LocationsExtractorSpec.testLookup, null)
    val locations = extractor.analyze(sentence).map(_.wofId).toSet
    assert(locations == Set(LocationsExtractorSpec.idManhattan, LocationsExtractorSpec.idNyc))
  }

  it should "build the locations lookup" in {
    val client = new TestFeatureServiceClient(Seq(
      FeatureServiceFeature(id = "id1", name = "New York", layer = "metro area"),
      FeatureServiceFeature(id = "id2", name = "New York", layer = "macroregion"),
      FeatureServiceFeature(id = "id3", name = "Gowanus Heights", layer = "neighbourhood")
    ), null)

    val extractorFactory = new TestLocationsExtractorFactory(client).buildLookup()
    val lookup = extractorFactory.getLookup

    assert(lookup.size == 2)
    assert(lookup("new york").map(_.wofId) == Set("id1"))
    assert(lookup("gowanus heights").map(_.wofId) == Set("id3"))
  }

  it should "handle point queries" in {
    val client = new TestFeatureServiceClient(Seq(
      FeatureServiceFeature(id = "id1", name = "New York", layer = "city"),
      FeatureServiceFeature(id = "id2", name = "Gowanus Heights", layer = "neighbourhood")
    ), Seq(
      FeatureServiceFeature(id = "id1", name = "New York", layer = "city"),
      FeatureServiceFeature(id = "id3", name = "Jersey", layer = "city")
    ))
    val extractorFactory = new TestLocationsExtractorFactory(client).buildLookup()
    val points = extractorFactory.fetch(12, 34).map(_.wofId)

    assert(points == Set("id1"))
  }
}
