## What's this? ##

Demo of ingesting Instagram data into Spark Streaming and analyzing the pictures using Cognitive Services.

Run it via:

```sh
# compile scala, run tests, build fat jar
sbt assembly

# run on spark
spark-submit --class DemoInstagram --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
spark-submit --class DemoLocations --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
```

Remember to update the Instagram and Cognitive Services access tokens in The demo files!
