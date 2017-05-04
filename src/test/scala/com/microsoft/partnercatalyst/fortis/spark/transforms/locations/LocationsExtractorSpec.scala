package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature
import org.scalatest.FlatSpec

class TestLocationsExtractor() extends LocationsExtractor(null, null) {
  val idNyc = "wof-1234"
  val idManhattan = "wof-5678"

  override def buildLookup(): this.type = {
    lookup = Map(
      "nyc" -> Set(idNyc),
      "ny" -> Set(idNyc),
      "new york" -> Set(idNyc),
      "big apple" -> Set(idManhattan),
      "manhattan" -> Set(idManhattan)
    )
    this
  }
}

class TestLocationsExtractorWithFakeClient(client: FeatureServiceClient) extends LocationsExtractor(client, null) {
  def getLookup: Map[String, Set[String]] = lookup
}

class TestFeatureServiceClient(givenBbox: Seq[FeatureServiceFeature], givenPoint: Seq[FeatureServiceFeature]) extends FeatureServiceClient("test-host") {
  override def bbox(geofence: Geofence): Iterable[FeatureServiceFeature] = givenBbox
  override def point(latitude: Double, longitude: Double): Iterable[FeatureServiceFeature] = givenPoint
}

class LocationsExtractorSpec extends FlatSpec {
  "The locations extractor" should "extract single location from text" in {
    val sentence = "Went to New York last week. It was wonderful."
    val extractor = new TestLocationsExtractor().buildLookup()
    val locations = extractor.analyze(sentence).map(_.wofId).toSet
    assert(locations == Set(extractor.idNyc))
  }

  it should "extract multiple locations from text" in {
    val sentence = "Manhattan is located in NYC, New York."
    val extractor = new TestLocationsExtractor().buildLookup()
    val locations = extractor.analyze(sentence).map(_.wofId).toSet
    assert(locations == Set(extractor.idManhattan, extractor.idNyc))
  }

  it should "build the locations lookup" in {
    val client = new TestFeatureServiceClient(Seq(
      FeatureServiceFeature(id = "id1", name = "New York", layer = "city"),
      FeatureServiceFeature(id = "id2", name = "New York", layer = "state"),
      FeatureServiceFeature(id = "id3", name = "Gowanus Heights", layer = "neighbourhood")
    ), null)
    val extractor = new TestLocationsExtractorWithFakeClient(client)
    val lookup = extractor.buildLookup().getLookup

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
    val extractor = new TestLocationsExtractorWithFakeClient(client).buildLookup()
    val points = extractor.fetch(12, 34).map(_.wofId)

    assert(points == Seq("id1"))
  }
}
