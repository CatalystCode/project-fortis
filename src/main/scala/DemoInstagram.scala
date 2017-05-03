import com.microsoft.catalystcode.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.transforms.{AnalyzedItem, Location}
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object DemoInstagram {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val instagramAuth = InstagramAuth("INSERT_INSTAGRAM_KEY_HERE")

    val locationStream = InstagramUtils.createLocationStream(ssc, instagramAuth, latitude = 49.25, longitude = -123.1)
    val tagStream = InstagramUtils.createTagStream(ssc, instagramAuth, tag = "rose")

    val imageAnalysis = new ImageAnalyzer(ImageAnalysisAuth("INSERT_COGNITIVE_SERVICES_KEY_HERE"))

    locationStream
      .union(tagStream)
      .map(instagram => {
        // general-purpose image analysis
        var analysis = imageAnalysis.analyze(instagram.images.standard_resolution.url)

        // instagram-specific post-processing
        if (instagram.location.isDefined) {
          val taggedLocation = Location(confidence = Some(1.0), latitude = Some(instagram.location.get.latitude), longitude = Some(instagram.location.get.longitude))
          analysis = analysis.copy(locations = taggedLocation :: analysis.locations)
        }

        // produce object in common data model
        AnalyzedItem(
          originalItem = instagram,
          analysis = analysis,
          source = instagram.link)
      })
      .print()

    ssc.start()
    ssc.awaitTermination()
  }
}
