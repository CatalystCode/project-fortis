package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.dto.SiteSettings
import org.apache.spark.{SparkConf, SparkContext}
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.{BeforeAndAfter, FlatSpec}
import twitter4j.FilterQuery
import twitter4j.conf.ConfigurationBuilder

import scala.util.Properties.envOrElse

class TwitterStreamFactorySpec extends FlatSpec with BeforeAndAfter {

  private val conf = new SparkConf()
    .setAppName(this.getClass.getSimpleName)
    .setMaster("local[*]")
    .set("output.consistency.level", "LOCAL_ONE")

  private var sc: SparkContext = _
  private var factory: TwitterStreamFactory = _
  private var configurationManager: ConfigurationManager = _
  private var siteSettings: SiteSettings = _

  before {
    sc = new SparkContext(conf)
    factory = new TwitterStreamFactory(configurationManager)
    configurationManager = Mockito.mock(classOf[ConfigurationManager])
    siteSettings = SiteSettings(
      sitename = "Fortis",
      geofence_json = "[1, 2, 3, 4]",
      defaultlanguage = Some("en"),
      languages_json = "[\"en\", \"es\", \"fr\"]",
      defaultzoom = 8,
      featureservicenamespace = Some("somenamespace"),
      title = "Fortis",
      logo = "",
      translationsvctoken = "",
      cogspeechsvctoken = "",
      cogvisionsvctoken = "",
      cogtextsvctoken = "",
      insertiontime = System.currentTimeMillis()
    )
    Mockito.when(configurationManager.fetchSiteSettings(ArgumentMatchers.any())).thenReturn(siteSettings)
  }

  after {
    sc.stop()
  }

  it should "append to query when watchlist is present" in {
    Mockito.when(configurationManager.fetchWatchlist(ArgumentMatchers.any())).thenReturn(Map(
      "en"->Seq("hello", "world"),
      "es"->Seq("hola", "mundo"),
      "fr"->Seq("salut", "monde")
    ))
    val query = new FilterQuery()
    val watchlistAppended = factory.appendWatchlist(query, sc, configurationManager)
    assert(watchlistAppended)
    assert(query == new FilterQuery("hello", "hola", "monde", "mundo", "salut", "world"))
  }

  it should "append subset to query when watchlist count exceeds max term count" in {
    Mockito.when(configurationManager.fetchWatchlist(ArgumentMatchers.any())).thenReturn(Map(
      "en"->Seq("hello", "world"),
      "es"->Seq("hola", "mundo"),
      "fr"->Seq("salut", "monde")
    ))

    factory.twitterMaxTermCount = 2

    val query0 = new FilterQuery()
    assert(factory.appendWatchlist(query0, sc, configurationManager))
    assert(query0 == new FilterQuery("hello", "hola"))

    val query1 = new FilterQuery()
    assert(factory.appendWatchlist(query1, sc, configurationManager))
    assert(query1 == new FilterQuery("monde", "mundo"))

    val query2 = new FilterQuery()
    assert(factory.appendWatchlist(query2, sc, configurationManager))
    assert(query2 == new FilterQuery("salut", "world"))
  }

  it should "return false when watchlist is absent" in {
    Mockito.when(configurationManager.fetchWatchlist(ArgumentMatchers.any())).thenReturn(Map[String, Seq[String]]())
    val query = new FilterQuery()
    val watchlistAppended = factory.appendWatchlist(query, sc, configurationManager)
    assert(!watchlistAppended)
    assert(query == new FilterQuery())
  }

  it should "append to query when languages are present" in {
    val query = new FilterQuery()
    val languagesAdded = factory.addLanguages(query, sc, configurationManager)
    assert(languagesAdded)
    val expectedQuery = new FilterQuery()
    expectedQuery.language("en", "es", "fr")
    assert(query == expectedQuery)
  }

  it should "return true when languages are absent but defaultlanguage is present" in {
    val noLanguageSiteSettings = SiteSettings(
      sitename = "Fortis",
      geofence_json = "[1, 2, 3, 4]",
      defaultlanguage = Some("en"),
      languages_json = "[]",
      defaultzoom = 8,
      featureservicenamespace = Some("somenamespace"),
      title = "Fortis",
      logo = "",
      translationsvctoken = "",
      cogspeechsvctoken = "",
      cogvisionsvctoken = "",
      cogtextsvctoken = "",
      insertiontime = System.currentTimeMillis()
    )
    Mockito.when(configurationManager.fetchSiteSettings(ArgumentMatchers.any())).thenReturn(noLanguageSiteSettings)

    val query = new FilterQuery()
    val languagesAdded = factory.addLanguages(query, sc, configurationManager)
    assert(languagesAdded)
    val expectedQuery = new FilterQuery()
    expectedQuery.language("en")
    assert(query == expectedQuery)
  }

  it should "return false when both languages and defaultlanguage are absent" in {
    val noLanguageSiteSettings = SiteSettings(
      sitename = "Fortis",
      geofence_json = "[1, 2, 3, 4]",
      defaultlanguage = None,
      languages_json = "[]",
      defaultzoom = 8,
      featureservicenamespace = Some("somenamespace"),
      title = "Fortis",
      logo = "",
      translationsvctoken = "",
      cogspeechsvctoken = "",
      cogvisionsvctoken = "",
      cogtextsvctoken = "",
      insertiontime = System.currentTimeMillis()
    )
    Mockito.when(configurationManager.fetchSiteSettings(ArgumentMatchers.any())).thenReturn(noLanguageSiteSettings)

    val query = new FilterQuery()
    val languagesAdded = factory.addLanguages(query, sc, configurationManager)
    assert(!languagesAdded)
    assert(query == new FilterQuery())
  }

  it should "parse user ids" in {
    val twitterConsumerKey = envOrElse("TWITTER_CONSUMER_KEY", "")
    val twitterConsumerSecret = envOrElse("TWITTER_CONSUMER_SECRET", "")
    val twitterAccessToken = envOrElse("TWITTER_ACCESS_TOKEN", "")
    val twitterAccessTokenSecret = envOrElse("TWITTER_ACCESS_TOKEN_SECRET", "")

    if (twitterConsumerKey.isEmpty || twitterConsumerSecret.isEmpty || twitterAccessToken.isEmpty || twitterAccessTokenSecret.isEmpty) {
      cancel("Twitter credentials not defined, skipping test")
    }

    val twitterConfig = new ConfigurationBuilder()
      .setOAuthConsumerKey(twitterConsumerKey)
      .setOAuthConsumerSecret(twitterConsumerSecret)
      .setOAuthAccessToken(twitterAccessToken)
      .setOAuthAccessTokenSecret(twitterAccessTokenSecret)
      .build

    assert(TwitterStreamFactory.parseUserIds(Map("foo" -> "bar"), twitterConfig).isEmpty)
    assert(TwitterStreamFactory.parseUserIds(Map("userIds" -> "clemenswolff"), twitterConfig).get sameElements Array(2222239916L))
    assert(TwitterStreamFactory.parseUserIds(Map("userIds" -> "codewithsteph|erikschlegel1"), twitterConfig).get sameElements Array(889224358119567365L, 142881621L))
    assert(TwitterStreamFactory.parseUserIds(Map("userIds" -> "2222239916|codewithsteph|142881621"), twitterConfig).get sameElements Array(2222239916L, 142881621L, 889224358119567365L))
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
