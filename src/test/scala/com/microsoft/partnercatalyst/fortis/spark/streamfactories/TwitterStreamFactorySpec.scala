package com.microsoft.partnercatalyst.fortis.spark.streamfactories

import org.scalatest.FlatSpec

class TwitterStreamFactorySpec extends FlatSpec {
  "The params parser" should "parse languages" in {
    assert(TwitterStreamFactory.parseLanguages(Map("foo" -> "bar")).isEmpty)
    assert(TwitterStreamFactory.parseLanguages(Map("languages" -> "en")).get sameElements Array("en"))
    assert(TwitterStreamFactory.parseLanguages(Map("languages" -> "en|fr")).get sameElements Array("en", "fr"))
  }

  it should "parse keywords" in {
    assert(TwitterStreamFactory.parseKeywords(Map("foo" -> "bar")).isEmpty)
    assert(TwitterStreamFactory.parseKeywords(Map("keywords" -> "foo")).get sameElements Array("foo"))
    assert(TwitterStreamFactory.parseKeywords(Map("keywords" -> "foo|bar|baz")).get sameElements Array("foo", "bar", "baz"))
  }

  it should "parse user ids" in {
    assert(TwitterStreamFactory.parseUserIds(Map("foo" -> "bar")).isEmpty)
    assert(TwitterStreamFactory.parseUserIds(Map("userIds" -> "123")).get sameElements Array(123L))
    assert(TwitterStreamFactory.parseUserIds(Map("userIds" -> "1|2|3")).get sameElements Array(1L, 2L, 3L))
  }

  it should "parse locations" in {
    assert(TwitterStreamFactory.parseLocations(Map("foo" -> "bar")).isEmpty)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-74,40,-73")).isEmpty)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-74,40|-73,41")).isEmpty)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-122.75,36.8,-121.75,37.8|40,-73,41")).isEmpty)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-74,40,-73,41")).get.length == 1)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-74,40,-73,41")).get(0) sameElements Array(-74D, 40D, -73D, 41D))
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-122.75,36.8,-121.75,37.8|-74,40,-73,41")).get.length == 2)
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-122.75,36.8,-121.75,37.8|-74,40,-73,41")).get(0) sameElements Array(-122.75D, 36.8D, -121.75D, 37.8D))
    assert(TwitterStreamFactory.parseLocations(Map("locations" -> "-122.75,36.8,-121.75,37.8|-74,40,-73,41")).get(1) sameElements Array(-74D, 40D, -73D, 41D))
  }
}
