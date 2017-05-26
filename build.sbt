// Here's a link to a blog post outlining a similar build config:
// http://mkuthan.github.io/blog/2016/03/11/spark-application-assembly/

name := "project-fortis-spark"

scalaVersion := "2.11.7"

scalacOptions ++= Seq(
  "-unchecked",
  "-deprecation",
  "-feature"
)

val sparkVersion = "2.1.0"

// Dependencies provided by the Spark distro
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % sparkVersion,
  "org.apache.spark" %% "spark-streaming" % sparkVersion
).map(_ % "provided")

// Bundled dependencies
libraryDependencies ++= Seq(
  "log4j" % "log4j" % "1.2.17",
  "com.microsoft.azure" % "applicationinsights-core" % "1.0.6",
  "com.microsoft.azure" % "applicationinsights-logging-log4j1_2" % "1.0.6",
  "com.github.catalystcode" % "streaming-instagram_2.11" % "0.0.5",
  "com.github.catalystcode" % "streaming-facebook_2.11" % "0.0.1",
  "org.apache.bahir" %% "spark-streaming-twitter" % "2.1.0",
  "org.apache.commons" % "commons-collections4" % "4.1",
  "com.microsoft.azure" %% "spark-streaming-eventhubs" % "2.0.5",
  "net.liftweb" %% "lift-json" % "3.0.1",
  "org.scalaj" %% "scalaj-http" % "2.3.0",
  "net.lingala.zip4j" % "zip4j" % "1.3.2",
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
