// Here's a link to a blog post outlining a similar build config:
// http://mkuthan.github.io/blog/2016/03/11/spark-application-assembly/

name := "project-fortis-spark"

scalaVersion := "2.11.8"

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

)

// Configure fat JAR
assemblyOption in assembly := (assemblyOption in assembly).value.copy(includeScala = false) // Exclude Scala libs

// Add fat JAR to published artifacts
artifact in (Compile, assembly) := {
  val art = (artifact in (Compile, assembly)).value
  art.copy(`classifier` = Some("assembly"))
}

addArtifact(artifact in (Compile, assembly), assembly)
