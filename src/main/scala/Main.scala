import java.util.concurrent.TimeUnit

import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.InstagramDStream
import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.client.{InstagramLocationClient, Location, Auth => InstagramAuth}
import com.microsoft.partnercatalyst.fortis.spark.sources.Schedule
import com.microsoft.partnercatalyst.fortis.spark.transforms.image.{ImageAnalyzer, Auth => VisionAuth}
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.streaming.{Seconds, StreamingContext}

object Main {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val instagramStream = new InstagramDStream(
      _ssc = ssc,
      schedule = Schedule(10, TimeUnit.SECONDS),
      client = new InstagramLocationClient(
        location = Location(lat = 49.25, lng = -123.1, radiusMeters = 5000),
        auth = InstagramAuth("INSERT_INSTAGRAM_TOKEN_HERE")))

    val imageAnalysis = new ImageAnalyzer(
      auth = VisionAuth("INSERT_COGNITIVE_SERVICES_TOKEN_HERE"))

    instagramStream
      .map(x => imageAnalysis.analyze(x))
      .print()

    ssc.start()
    ssc.awaitTermination()
  }
}
