package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories.TwitterStreamFactory._
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.twitter.TwitterUtils
import twitter4j.auth.OAuthAuthorization
import twitter4j.conf.{Configuration, ConfigurationBuilder}
import twitter4j.{FilterQuery, Status, TwitterFactory}

import scala.collection.JavaConverters._
import scala.collection.mutable
import scala.util.Try

class TwitterStreamFactory(configurationManager: ConfigurationManager) extends StreamFactoryBase[Status] {

  private[streamfactories] var twitterMaxTermCount = sys.env.getOrElse("FORTIS_TWITTER_MAX_TERM_COUNT", 400.toString).toInt

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    "Twitter".equalsIgnoreCase(connectorConfig.name)
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[Status] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val consumerKey = params.getAs[String]("consumerKey")
    val consumerSecret = params.getAs[String]("consumerSecret")
    val accessToken = params.getAs[String]("accessToken")
    val accessTokenSecret = params.getAs[String]("accessTokenSecret")

    val twitterConfig = new ConfigurationBuilder()
      .setOAuthConsumerKey(consumerKey)
      .setOAuthConsumerSecret(consumerSecret)
      .setOAuthAccessToken(accessToken)
      .setOAuthAccessTokenSecret(accessTokenSecret)
      .build

    val auth = new OAuthAuthorization(twitterConfig)

    val query = new FilterQuery

    if (params.getOrElse("watchlistFilteringEnabled", "true").toString.toBoolean) {
      val keywordsAdded = appendWatchlist(query, ssc.sparkContext, configurationManager)
      if (!keywordsAdded) {
        Log.logInfo(s"No keywords used for Twitter consumerKey $consumerKey. Returning empty stream.")
        return ssc.queueStream(new mutable.Queue[RDD[Status]])
      }
    }

    val languagesAdded = addLanguages(query, ssc.sparkContext, configurationManager)
    if (!languagesAdded) {
      Log.logInfo(s"No languages set for Twitter consumerKey $consumerKey. Returning empty stream.")
      return ssc.queueStream(new mutable.Queue[RDD[Status]])
    }

    val usersAdded = addUsers(query, params, twitterConfig)
    if (!usersAdded) {
      Log.logInfo(s"No users set for Twitter consumerKey $consumerKey")
    }

    val stream = TwitterUtils.createFilteredStream(
      ssc,
      twitterAuth = Some(auth),
      query = Some(query)
    )

    val trustedSourceScreenNames = params.getTrustedSources.toSet
    stream.filter(status=>{
      def isOriginalTweet(status: Status) : Boolean = {
        !status.isRetweet && status.getRetweetedStatus == null
      }

      if (!isOriginalTweet(status)) {
        false
      } else {
        if (trustedSourceScreenNames.isEmpty) {
          true
        } else {
          trustedSourceScreenNames.contains(status.getUser.getScreenName)
        }
      }
    })
  }

  private[streamfactories] def appendWatchlist(query: FilterQuery, sparkContext: SparkContext, configurationManager: ConfigurationManager): Boolean = {
    val watchlistCurrentOffsetKey = "TwitterStreamFactory.watchlistCurrentOffset"
    val watchlistCurrentOffsetValue = sparkContext.getLocalProperty(watchlistCurrentOffsetKey) match {
      case value:String => value.toInt
      case _ => 0
    }

    val watchlist = configurationManager.fetchWatchlist(sparkContext)
    val sortedTerms = watchlist.values.flatten.toList.sorted

    val terms = sortedTerms.drop(watchlistCurrentOffsetValue)
    if (terms.isEmpty) return false

    val maxTerms = twitterMaxTermCount
    val updatedWatchlistCurrentOffsetValue = watchlistCurrentOffsetValue + maxTerms
    val selectedTerms = terms.filter(_.getBytes("UTF-8").length < 60).take(maxTerms)
    query.track(selectedTerms:_*)

    sparkContext.setLocalProperty(watchlistCurrentOffsetKey, updatedWatchlistCurrentOffsetValue.toString)

    true
  }

  private def addUsers(query: FilterQuery, params: Map[String, Any], twitterConfig: Configuration): Boolean = {
    parseUserIds(params, twitterConfig) match {
      case Some(userIds) =>
        query.follow(userIds:_*)
        true
      case None =>
        false
    }
  }

  private[streamfactories] def addLanguages(query: FilterQuery, sparkContext: SparkContext, configurationManager: ConfigurationManager): Boolean = {
    val allLanguages = configurationManager.fetchSiteSettings(sparkContext).getAllLanguages()

    allLanguages.size match {
      case 0 => false
      case _ =>
        query.language(allLanguages:_*)
        true
    }
  }

}

object TwitterStreamFactory {
  def parseLocations(params: Map[String, Any]): Option[Array[Array[Double]]] = {
    parseList(params, "locations").map(_.map(_.split(','))) match {
      case None => None
      case Some(locations) if locations.exists(_.length != 4) => None
      case Some(locations) => Some(locations.map(_.map(_.toDouble)))
    }
  }

  def parseUserIds(params: Map[String, Any], twitterConfig: Configuration): Option[Array[Long]] = {
    parseList(params, "userIds").map(users => {
      val twitter = new TwitterFactory(twitterConfig).getInstance

      val (ids, names) = users.partition(user => Try(user.toLong).isSuccess)

      val idProfiles = ids.map(_.toLong)

      val nameProfiles = names
        .map(_.toLowerCase)
        .grouped(100)
        .flatMap(screenNames => twitter.users().lookupUsers(screenNames:_*).asScala)
        .map(_.getId)

      idProfiles ++ nameProfiles
    })
  }

  private def parseList(params: Map[String, Any], key: String): Option[Array[String]] = params.get(key).map(_.asInstanceOf[String].split('|'))
}
