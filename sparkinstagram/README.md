## What's this? ##

Demo of ingesting Instagram data into Spark Streaming and analyzing the pictures using Cognitive Services.

Run it via:

```sh
# compile scala, run tests, build fat jar
sbt assembly

# run on spark
spark-submit --class Main --master local[4] sparkinstagram/target/scala-2.11/simple-project-assembly-1.0.jar
```

Remember to update the Instagram and Cognitive Services access tokens in `Main.scala`!

## How does it work? ##

Instagram doesn't expose a firehose API so we resort to polling. The InstagramReceiver pings the Instagram API every few
seconds and pushes any new images into Spark Streaming for further processing. The images are then picked up by
ImageAnalyzer and sent to Cognitive Services to be augmented with the analysis results.

Currently, ingestion of images by location (latitude/longitude) or hashtag are supported.
