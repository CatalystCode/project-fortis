import com.microsoft.partnercatalyst.fortis.spark.transforms.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.{Geofence, LocationsExtractor}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object Main2 {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val geofence = Geofence(north = 16.829126675000003, west = -23.017646899999998,
                            south = 16.629126675000003, east = -22.817646899999998)

    val locationsExtractor = new LocationsExtractor(geofence).buildLookup()

    val textStream = sc.parallelize(Seq(
      "Went to New York last week. It was wonderful.",
      "Manhatten is my favorite place in NYC."))

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
      .foreach(println)

    ssc.start()
    ssc.awaitTermination()
  }
}
