package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature
import org.scalatest.FlatSpec

object LocationsExtractorSpec {
  val idNyc = "wof-1234"
  val idManhattan = "wof-5678"

  val testLookup = Map(
    "nyc" -> Set(idNyc),
    "ny" -> Set(idNyc),
    "new york" -> Set(idNyc),
    "big apple" -> Set(idManhattan),
    "manhattan" -> Set(idManhattan)
  )
}

class TestLocationsExtractorFactory(client: FeatureServiceClient) extends LocationsExtractorFactory(client, geofence = null) {
  def getLookup: Map[String, Set[String]] = lookup
}

class TestFeatureServiceClient(givenBbox: Seq[FeatureServiceFeature], givenPoint: Seq[FeatureServiceFeature]) extends FeatureServiceClient("test-host") {
  override def bbox(geofence: Geofence): Iterable[FeatureServiceFeature] = givenBbox
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
      FeatureServiceFeature(id = "id1", name = "New York", layer = "city"),
      FeatureServiceFeature(id = "id2", name = "New York", layer = "state"),
      FeatureServiceFeature(id = "id3", name = "Gowanus Heights", layer = "neighbourhood")
    ), null)

    val extractorFactory = new TestLocationsExtractorFactory(client).buildLookup()
    val lookup = extractorFactory.getLookup

    assert(lookup == Map(
      "new york" -> Set("id1", "id2"),
      "gowanus heights" -> Set("id3")
    ))
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
