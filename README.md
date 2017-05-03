## What's this? ##

This project contains demos of the various Spark Streaming data processing methods for Project Fortis:

- Ingesting Instagram pictures and analyzing them using Cognitive Services.
- Ingesting Twitter tweets and extracting locations using Open Street Map.

Run it via:

```sh
# compile scala, run tests, build fat jar
sbt assembly

# run on spark
spark-submit --class DemoInstagram --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
spark-submit --class DemoLocations --master local[4] target/scala-2.11/simple-project-assembly-1.0.jar
```

Remember to update the access tokens in the demo files for Instagram, Twitter, Cognitive Services, etc!
