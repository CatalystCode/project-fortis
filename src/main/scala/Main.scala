import com.microsoft.partnercatalyst.fortis.spark.streaming.instagram.{InstagramAuth, InstagramUtils}
import com.microsoft.partnercatalyst.fortis.spark.transforms.AnalyzedItem
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalysisAuth, ImageAnalyzer}
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

object Main {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val instagramAuth = InstagramAuth("INSERT_INSTAGRAM_TOKEN_HERE")

    val locationStream = InstagramUtils.createLocationStream(ssc, instagramAuth, latitude = 49.25, longitude = -123.1)
    val tagStream = InstagramUtils.createTagStream(ssc, instagramAuth, tag = "rose")

    val imageAnalysis = new ImageAnalyzer(ImageAnalysisAuth("INSERT_COGNITIVE_SERVICES_TOKEN_HERE"))

    locationStream
      .union(tagStream)
      .map(instagram => {
        val analysis = imageAnalysis.analyze(instagram.images.standard_resolution.url)
        AnalyzedItem(instagram, analysis)
      })
      .print()

    ssc.start()
    ssc.awaitTermination()
  }
}
