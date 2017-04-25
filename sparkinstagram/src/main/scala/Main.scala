import java.util.concurrent.TimeUnit

import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.InstagramReceiver
import com.microsoft.partnercatalyst.fortis.spark.sources.instagram.client.{Auth, InstagramLocationClient, Location}
import com.microsoft.partnercatalyst.fortis.spark.sources.Schedule
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.streaming.{Seconds, StreamingContext}

object Main {
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application")
    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(1))

    val instagramStream = ssc.receiverStream(new InstagramReceiver(
      schedule = Schedule(10, TimeUnit.SECONDS),
      client = new InstagramLocationClient(
        location = Location(lat = 123.1, lng = 21.2),
        auth = Auth("INSERT_INSTAGRAM_ACCESS_CODE_HERE"))))

    instagramStream.map(x => x.link).print()

    ssc.start()
    ssc.awaitTermination()
  }
}
