// Here's a link to a blog post outlining a similar build config:
// http://mkuthan.github.io/blog/2016/03/11/spark-application-assembly/

name := "project-fortis-spark"

scalaVersion := "2.11.7"

scalacOptions ++= Seq(
  "-target:jvm-1.8",
  "-unchecked",
  "-deprecation",
  "-feature"
)

val sparkVersion = "2.2.0"

parallelExecution in Test := false

// Dependencies provided by the Spark distro
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion,
  "org.apache.spark" %% "spark-sql" % sparkVersion,
  "org.apache.spark" %% "spark-streaming" % sparkVersion
).map(_ % "provided")

// Bundled dependencies
libraryDependencies ++= Seq(
  "log4j" % "log4j" % "1.2.17",
  "com.microsoft.azure" % "applicationinsights-core" % "1.0.6",
  "com.microsoft.azure" % "applicationinsights-logging-log4j1_2" % "1.0.6",
  "com.github.catalystcode" %% "streaming-instagram" % "0.0.5",
  "com.github.catalystcode" %% "streaming-facebook" % "0.0.3",
  "com.github.catalystcode" %% "streaming-bing" % "0.0.1",
  "com.datastax.spark" %% "spark-cassandra-connector" % "2.0.2",
  "com.github.catalystcode" %% "streaming-reddit" % "0.0.2",
  "com.github.catalystcode" % "speechtotext-websockets-java" % "0.0.7",
  "org.twitter4j" % "twitter4j-stream" % "4.0.4",
  "org.apache.commons" % "commons-collections4" % "4.1",
  "com.microsoft.azure" %% "spark-streaming-eventhubs" % "2.1.2" exclude("com.microsoft.azure", "azure-eventhubs"),
  "com.microsoft.azure" % "azure-servicebus" % "1.0.0-PREVIEW-3",
  "com.esotericsoftware.kryo" % "kryo" % "2.24.0",
  "com.github.benfradet" %% "spark-kafka-0-10-writer" % "0.3.0",
  "org.apache.kafka" %% "kafka" % "0.10.2.1",
  "net.liftweb" %% "lift-json" % "3.0.1",
  "org.scalaj" %% "scalaj-http" % "2.3.0",
  "org.scala-lang.modules" %% "scala-java8-compat" % "0.8.0",
  "net.lingala.zip4j" % "zip4j" % "1.3.2",
  "com.optimaize.languagedetector" % "language-detector" % "0.6",
  "eus.ixa" % "ixa-pipe-pos" % "1.5.2",
  "eus.ixa" % "ixa-pipe-tok" % "1.8.6",
  "eus.ixa" % "ixa-pipe-nerc" % "1.6.1"
)

// Test dependencies
libraryDependencies ++= Seq(
  "org.scalatest" %% "scalatest" % "2.2.1"
).map(_ % "test")

// Configure fat JAR
assemblyOption in assembly := (assemblyOption in assembly).value.copy(includeScala = false) // Exclude Scala libs

// Add fat JAR to published artifacts
artifact in (Compile, assembly) := {
  val art = (artifact in (Compile, assembly)).value
  art.copy(`classifier` = Some("assembly"))
}

addArtifact(artifact in (Compile, assembly), assembly)

// Rename servicebus namespace in package spark-streaming-eventhubs to avoid confliction with azure-servicebus.
// TODO: azure-eventhubs will rename their conflicting service bus package in the future (PR: https://github.com/Azure/azure-event-hubs-java/pull/101).
//       Once this is done, spark-streaming-eventhubs needs to publish an updated lib containing this change (since they distribute a fat JAR), and then
//       we can update to that package and remove this shading.
assemblyShadeRules in assembly := Seq(
  ShadeRule.rename("com.microsoft.azure.servicebus.**" -> "com.microsoft.azure.eventhub.servicebus.@1").inLibrary("com.microsoft.azure" % "spark-streaming-eventhubs_2.11" % "2.1.2", "com.microsoft.azure" % "azure-eventhubs" % "0.13.1"),
  ShadeRule.rename("scalaj.http.**" -> "eventhub.scalaj.http.@1").inLibrary("com.microsoft.azure" % "spark-streaming-eventhubs_2.11" % "2.1.2")
)

assemblyMergeStrategy in assembly := {
  case PathList("javax", "inject", xs @ _*) => MergeStrategy.last
  case PathList("javax", "servlet", xs @ _*) => MergeStrategy.last
  case PathList("javax", "annotation", xs @ _*) => MergeStrategy.last
  case PathList("javax", "activation", xs @ _*) => MergeStrategy.last
  case PathList("com", "github", "catalystcode", xs @ _*) => MergeStrategy.last
  case PathList("eus", "ixa", xs @ _*) => MergeStrategy.last
  case PathList("org", "aopalliance", xs @ _*) => MergeStrategy.last
  case PathList("org", "apache", xs @ _*) => MergeStrategy.last
  case PathList("com", "google", xs @ _*) => MergeStrategy.last
  case PathList("com", "esotericsoftware", xs @ _*) => MergeStrategy.last
  case PathList("com", "codahale", xs @ _*) => MergeStrategy.last
  case PathList("com", "yammer", xs @ _*) => MergeStrategy.last
  case "about.html" => MergeStrategy.rename
  case "META-INF/ECLIPSEF.RSA" => MergeStrategy.last
  case "META-INF/mailcap" => MergeStrategy.last
  case "META-INF/mimetypes.default" => MergeStrategy.last
  case "plugin.properties" => MergeStrategy.last
  case "log4j.properties" => MergeStrategy.last
  case x =>
    val oldStrategy = (assemblyMergeStrategy in assembly).value
    oldStrategy(x)
}
