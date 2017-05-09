import com.github.catalystcode.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.transforms.{Analysis, AnalyzedItem}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.nlp.PlaceRecognizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor}
import org.apache.log4j.{Level, Logger}
import org.apache.spark.streaming.twitter.TwitterUtils
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object DemoInstagramAndLocations {
  def main(args: Array[String]) {
    val mode = args.headOption.getOrElse("")
    if (mode.isEmpty) {
      System.err.println("Please specify a mode")
      System.exit(1)
    }

    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))
    Logger.getLogger("org").setLevel(Level.ERROR)
    Logger.getLogger("akka").setLevel(Level.ERROR)
    Logger.getLogger("libinstagram").setLevel(Level.DEBUG)
    Logger.getLogger("liblocations").setLevel(Level.DEBUG)

    val geofence = Geofence(north = 49.6185146245, west = -124.9578052195, south = 46.8691952854, east = -121.0945042053)  // useful tool to get fences for testing: http://boundingbox.klokantech.com
    val placeRecognizer = new PlaceRecognizer()
    val featureServiceClient = new FeatureServiceClient("localhost:8080")
    val locationsExtractor = new LocationsExtractor(featureServiceClient, geofence, Some(placeRecognizer)).buildLookup()
    val imageAnalysis = new ImageAnalyzer(ImageAnalysisAuth(System.getenv("OXFORD_VISION_TOKEN")), featureServiceClient)

    val instagramAuth = InstagramAuth(System.getenv("INSTAGRAM_AUTH_TOKEN"))
    System.setProperty("twitter4j.oauth.consumerKey", System.getenv("TWITTER_CONSUMER_KEY"))
    System.setProperty("twitter4j.oauth.consumerSecret", System.getenv("TWITTER_CONSUMER_SECRET"))
    System.setProperty("twitter4j.oauth.accessToken", System.getenv("TWITTER_ACCESS_TOKEN"))
    System.setProperty("twitter4j.oauth.accessTokenSecret", System.getenv("TWITTER_ACCESS_TOKEN_SECRET"))

    if (mode.contains("instagram")) {
      val instagramLocationStream = InstagramUtils.createLocationStream(ssc, instagramAuth, latitude = 49.25, longitude = -123.1)
      val instagramTagStream = InstagramUtils.createTagStream(ssc, instagramAuth, tag = "rose")

      instagramLocationStream.union(instagramTagStream)
        .map(instagram => {
          // do computer vision analysis: keyword extraction, etc.
          val source = instagram.link
          println(source)
          val analysis = imageAnalysis.analyze(instagram.images.standard_resolution.url)
          AnalyzedItem(originalItem = instagram, analysis = analysis, source = source)
        })
        .map(analyzedInstagram => {
          // map tagged locations to location features
          var analyzed = analyzedInstagram
          val instagram = analyzed.originalItem
          if (instagram.location.isDefined) {
            val location = instagram.location.get
            val taggedLocations = locationsExtractor.fetch(latitude = location.latitude, longitude = location.longitude).toList
            analyzed = analyzed.copy(analysis = analyzed.analysis.copy(
              locations = taggedLocations ++ analyzed.analysis.locations))
          }
          analyzed
        })
        .map(x => s"${x.source} --> ${x.analysis.locations.mkString(",")}").print(20)
    }

    if (mode.contains("twitter")) {
      val twitterStream = TwitterUtils.createStream(ssc, twitterAuth = None, filters = Seq(/*"coffee", "tea", "drink", "beverage", "cup"*/))

      twitterStream
        .map(tweet => {
          val source = s"https://twitter.com/statuses/${tweet.getId}"
          println(source)
          val analysis = Analysis()  // TODO: do nlp category extraction here
          AnalyzedItem(originalItem = tweet, analysis = analysis, source = source)
        })
        .map(analyzedTweet => {
          // map tagged locations to location features
          var analyzed = analyzedTweet
          val location = analyzed.originalItem.getGeoLocation
          if (location != null) {
            val lat = location.getLatitude
            val lng = location.getLongitude
            val taggedLocations = locationsExtractor.fetch(latitude = lat, longitude = lng).toList
            analyzed = analyzed.copy(analysis = analyzed.analysis.copy(locations = taggedLocations ++ analyzed.analysis.locations))
          }
          analyzed
        })
        .map(analyzedTweet => {
          // infer locations from text
          val language = if (analyzedTweet.originalItem.getLang != null) { Some(analyzedTweet.originalItem.getLang.toLowerCase) } else { None }
          val inferredLocations = locationsExtractor.analyze(analyzedTweet.originalItem.getText, language).toList
          analyzedTweet.copy(analysis = analyzedTweet.analysis.copy(locations = inferredLocations ++ analyzedTweet.analysis.locations))
        })
        .map(x => s"${x.source} --> ${x.analysis.locations.mkString(",")}").print(20)
    }

    ssc.start()
    ssc.awaitTerminationOrTimeout(Seconds(60).milliseconds)
  }
}
