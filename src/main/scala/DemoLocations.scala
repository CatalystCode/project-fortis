import com.microsoft.partnercatalyst.fortis.spark.transforms.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

import scala.collection.mutable

object DemoLocations {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val geofence = Geofence(north = 40.5561, west = -74.105,
                            south = 40.8589, east = -73.8314)

    val featureServiceClient = new FeatureServiceClient("localhost:8080")

    val locationsExtractor = new LocationsExtractor(featureServiceClient, geofence).buildLookup()

    val lines1 = sc.parallelize(Seq(
      "Went to New York last week. It was wonderful.",
      "Manhattan is my favorite place in NYC."))
    val lines2 = sc.parallelize(Seq(
      "Appartment viewing in East Village :O"))

    val textStream = ssc.queueStream[String](mutable.Queue(lines1, lines2))

    textStream
      .map(text => {
        // general-purpose image analysis
        val analysis = locationsExtractor.analyze(text)

        // produce object in common data model
        AnalyzedItem(
          originalItem = text,
          analysis = analysis,
          source = null)
      })
      .print()

    ssc.start()
    ssc.awaitTermination()
  }
}
