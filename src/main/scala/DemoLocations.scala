import com.microsoft.partnercatalyst.fortis.spark.transforms.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor}
import org.apache.log4j.{Level, Logger}
import org.apache.spark.streaming.twitter.TwitterUtils
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object DemoLocations {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))
    Logger.getLogger("org").setLevel(Level.ERROR)
    Logger.getLogger("akka").setLevel(Level.ERROR)

    // useful tool to get fences for testing: http://boundingbox.klokantech.com
    val geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053)
    val featureServiceClient = new FeatureServiceClient("localhost:8080")
    val locationsExtractor = new LocationsExtractor(featureServiceClient, geofence).buildLookup()

    System.setProperty("twitter4j.oauth.consumerKey", System.getenv("TWITTER_CONSUMER_KEY"))
    System.setProperty("twitter4j.oauth.consumerSecret", System.getenv("TWITTER_CONSUMER_SECRET"))
    System.setProperty("twitter4j.oauth.accessToken", System.getenv("TWITTER_ACCESS_TOKEN"))
    System.setProperty("twitter4j.oauth.accessTokenSecret", System.getenv("TWITTER_ACCESS_TOKEN_SECRET"))
    val twitterStream = TwitterUtils.createStream(ssc, twitterAuth = None, filters = Seq(/*"coffee", "tea", "drink", "beverage", "cup"*/))

    val textStream = twitterStream.map(_.getText)

    textStream
      .map(text => {
        val analysis = locationsExtractor.analyze(text)

        // produce object in common data model
        AnalyzedItem(
          originalItem = text,
          analysis = analysis,
          source = null)
      })
      .filter(_.analysis.locations.nonEmpty)
      .map(x => s"${x.originalItem}\t${x.analysis.locations.map(_.geometry).mkString(",")}")
      .print(20)

    ssc.start()
    ssc.awaitTerminationOrTimeout(Seconds(60).milliseconds)
  }
}
