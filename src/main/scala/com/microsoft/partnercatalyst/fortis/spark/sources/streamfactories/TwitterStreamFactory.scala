package com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories

import com.microsoft.partnercatalyst.fortis.spark.dba.ConfigurationManager
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.sources.streamfactories.TwitterStreamFactory._
import com.microsoft.partnercatalyst.fortis.spark.sources.streamprovider.ConnectorConfig
import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD
import org.apache.spark.streaming.StreamingContext
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.twitter.TwitterUtils
import twitter4j.auth.OAuthAuthorization
import twitter4j.conf.ConfigurationBuilder
import twitter4j.{FilterQuery, Status}

import scala.collection.mutable

class TwitterStreamFactory(configurationManager: ConfigurationManager) extends StreamFactoryBase[Status] with Loggable {

  private[streamfactories] var twitterMaxTermCount = sys.env.getOrElse("FORTIS_TWITTER_MAX_TERM_COUNT", 400.toString).toInt

  override protected def canHandle(connectorConfig: ConnectorConfig): Boolean = {
    connectorConfig.name == "Twitter"
  }

  override protected def buildStream(ssc: StreamingContext, connectorConfig: ConnectorConfig): DStream[Status] = {
    import ParameterExtensions._

    val params = connectorConfig.parameters
    val consumerKey = params.getAs[String]("consumerKey")
    val auth = new OAuthAuthorization(
      new ConfigurationBuilder()
        .setOAuthConsumerKey(consumerKey)
        .setOAuthConsumerSecret(params.getAs[String]("consumerSecret"))
        .setOAuthAccessToken(params.getAs[String]("accessToken"))
        .setOAuthAccessTokenSecret(params.getAs[String]("accessTokenSecret"))
        .build()
    )

    val query = new FilterQuery

    val keywordsAdded = appendWatchlist(query, ssc.sparkContext, configurationManager)
    if (!keywordsAdded) {
      logInfo(s"No keywords used for Twitter consumerKey $consumerKey. Returning empty stream.")
      return ssc.queueStream(new mutable.Queue[RDD[Status]])
    }

    val languagesAdded = addLanguages(query, ssc.sparkContext, configurationManager)
    if (!languagesAdded) {
      logInfo(s"No languages set for Twitter consumerKey $consumerKey. Returning empty stream.")
      return ssc.queueStream(new mutable.Queue[RDD[Status]])
    }

    val usersAdded = addUsers(query, params)
    if (!usersAdded) {
      logInfo(s"No users set for Twitter consumerKey $consumerKey")
    }

    val stream = TwitterUtils.createFilteredStream(
      ssc,
      twitterAuth = Some(auth),
      query = Some(query)
    )

    params.getOrElse("trustedSourceFilterEnabled", "true").toString.toBoolean match {
      case false => stream
      case true => {
        val trustedSourceScreenNames = configurationManager.fetchTrustedSources(sparkContext = ssc.sparkContext)
          .filter(source=>source.pipelinekey.equalsIgnoreCase("twitter"))
          .map(source=>source.externalsourceid).toSet

        stream.filter(status=>{ trustedSourceScreenNames.contains(status.getUser.getScreenName) && !status.isRetweet })
      }
    }
  }

  private[streamfactories] def appendWatchlist(query: FilterQuery, sparkContext: SparkContext, configurationManager: ConfigurationManager): Boolean = {
    val watchlistCurrentOffsetKey = "TwitterStreamFactory.watchlistCurrentOffset"
    val watchlistCurrentOffsetValue = sparkContext.getLocalProperty(watchlistCurrentOffsetKey) match {
      case value:String => value.toInt
      case _ => 0
    }

    val watchlist = configurationManager.fetchWatchlist(sparkContext)
    val sortedTerms = watchlist.values.flatMap(v=>v).toList.sorted

    val terms = sortedTerms.drop(watchlistCurrentOffsetValue)
    if (terms.isEmpty) return false

    val maxTerms = twitterMaxTermCount
    val updatedWatchlistCurrentOffsetValue = watchlistCurrentOffsetValue + maxTerms
    val selectedTerms = terms.take(maxTerms)
    query.track(selectedTerms:_*)

    sparkContext.setLocalProperty(watchlistCurrentOffsetKey, updatedWatchlistCurrentOffsetValue.toString)

    true
  }

  private def addUsers(query: FilterQuery, params: Map[String, Any]): Boolean = {
    parseUserIds(params) match {
      case Some(userIds) =>
        query.follow(userIds:_*)
        true
      case None =>
        false
    }
  }

  private[streamfactories] def addLanguages(query: FilterQuery, sparkContext: SparkContext, configurationManager: ConfigurationManager): Boolean = {
    val defaultlanguage = configurationManager.fetchSiteSettings(sparkContext).defaultlanguage
    val languages = configurationManager.fetchSiteSettings(sparkContext).languages
    val allLanguages = defaultlanguage match {
      case None => languages
      case Some(language) => (Set(language) ++ languages.toSet).toSeq
    }

    allLanguages.size match {
      case 0 => false
      case _ => {
        query.language(allLanguages:_*)
        true
      }
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

  def parseUserIds(params: Map[String, Any]): Option[Array[Long]] = parseList(params, "userIds").map(_.map(_.toLong))

  private def parseList(params: Map[String, Any], key: String): Option[Array[String]] = params.get(key).map(_.asInstanceOf[String].split('|'))
}
