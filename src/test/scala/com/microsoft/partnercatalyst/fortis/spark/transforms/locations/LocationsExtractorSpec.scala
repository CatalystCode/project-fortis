package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.transforms.Location
import org.scalatest.FlatSpec

class StringUtilsTests extends FlatSpec {
  "The ngrams method" should "extract correct ngrams" in {
    assert(StringUtils.ngrams("the koala eats", n = 1) == List("the", "koala", "eats"))
    assert(StringUtils.ngrams("the koala eats", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
    assert(StringUtils.ngrams("the koala eats", n = 3) == List("the", "koala", "eats", "the koala", "koala eats", "the koala eats"))
    assert(StringUtils.ngrams("the koala eats", n = 4) == List("the", "koala", "eats", "the koala", "koala eats", "the koala eats"))
  }

  it should "ignore extra whitespace" in {
    assert(StringUtils.ngrams("the  koala  eats ", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
  }

  it should "ignore punctuation" in {
    assert(StringUtils.ngrams("the koala, eats!", n = 2) == List("the", "koala", "eats", "the koala", "koala eats"))
  }
}

class TestLocationsExtractor extends LocationsExtractor(Geofence(1, 2, 3, 4)) {
  val geometryNyc = "POLYGON((-74.175568 40.64626200000002,-74.184322 40.64613099999998,-74.202175 40.63115099999999,-74.203033 40.614995,-74.20475 40.606524000000014,-74.199257 40.60079000000001,-74.1996 40.59779199999999,-74.206467 40.58866800000002,-74.21333300000002 40.563894000000026,-74.21814 40.55737400000002,-74.228439 40.558939,-74.244576 40.551635000000026,-74.251785 40.54407000000001,-74.245949 40.52319500000001,-74.256935 40.512755000000006,-74.261055 40.498398,-74.254532 40.48899800000001,-74.113598 40.53154599999998,-74.064846 40.58293100000001,-73.9436526 40.53767760000001,-73.7941143 40.58383780000001,-73.7352563 40.59323000000002,-73.7352156 40.59803980000001,-73.7344024 40.60324059999999,-73.7405412 40.6156744,-73.7391259 40.625960200000016,-73.7299939 40.630168200000014,-73.7306722 40.64053399999999,-73.71658620000001 40.6442561,-73.7119303 40.65222150000001,-73.70114170000001 40.662214600000006,-73.6906921 40.679758999999976,-73.683432 40.6977974,-73.6702073 40.706983400000006,-73.6621286 40.7229333,-73.6868478 40.750768399999984,-73.7478601 40.782754100000005,-73.7852097 40.79821699999998,-73.7625504 40.8390089,-73.7618637 40.86082349999999,-73.7821198 40.879515999999995,-73.8442612 40.8989818,-73.8439178 40.9119558,-73.8531876 40.91532870000001,-73.8686371 40.906507100000006,-73.9167023 40.91766359999998,-73.9229679 40.8977492,-73.9319868 40.87872160000002,-73.9506136 40.85475319999999,-73.9609909 40.829397799999995,-74.0145493 40.7579202,-74.0348056 40.68727659999999,-74.066734 40.64339600000001,-74.081497 40.653425,-74.093685 40.64821499999998,-74.109478 40.64821499999998,-74.125614 40.643787,-74.134369 40.64391699999998,-74.142952 40.64209399999998,-74.175568 40.64626200000002))"
  val geometryManhattan = "POLYGON((-73.912528 40.796118, -73.921903 40.801776, -73.92766300000001 40.8024, -73.932364 40.80852, -73.933247 40.835632, -73.929128 40.844264, -73.920076 40.85659, -73.913396 40.863342, -73.906769 40.87598100000001, -73.911584 40.87913999999999, -73.915578 40.875696, -73.919855 40.87647, -73.933923 40.882019, -73.952891 40.851198, -73.963639 40.826673, -74.013934 40.757798, -74.023584 40.718157000000005, -74.026382 40.70013500000001, -74.035433 40.685121, -74.019577 40.679654, -74.004043 40.68879, -73.996531 40.701445, -73.9934 40.704633, -73.980909 40.705713, -73.969853 40.709427, -73.967286 40.716938, -73.961722 40.72487, -73.962547 40.736437, -73.96197500000001 40.741297, -73.957017 40.748819, -73.951051 40.754939, -73.941379 40.76709, -73.935903 40.77000099999999, -73.937838 40.774833, -73.934558 40.778251000000004, -73.930038 40.776399, -73.922345 40.780811, -73.90975 40.790954, -73.912528 40.796118))"

  override def buildLookup(): this.type = {
    lookup = Map(
      "NYC" -> Set(geometryNyc),
      "nyc" -> Set(geometryNyc),
      "ny" -> Set(geometryNyc),
      "New York" -> Set(geometryNyc),
      "big apple" -> Set(geometryManhattan),
      "Manhattan" -> Set(geometryManhattan)
    )
    this
  }
}

class LocationsExtractorSpec extends FlatSpec {
  "The locations extractor" should "extract single location from text" in {
    val sentence = "Went to New York last week. It was wonderful."
    val extractor = new TestLocationsExtractor().buildLookup()
    val locations = extractor.analyze(sentence).locations.toSet
    assert(locations == Set(Location(geometry = Some(extractor.geometryNyc))))
  }

  it should "extract multiple locations from text" in {
    val sentence = "Manhattan is located in NYC, New York."
    val extractor = new TestLocationsExtractor().buildLookup()
    val locations = extractor.analyze(sentence).locations.toSet
    assert(locations == Set(Location(geometry = Some(extractor.geometryManhattan)),
                            Location(geometry = Some(extractor.geometryNyc))))
  }
}
