pomExtra in Global := {
  <url>github.com/CatalystCode/project-fortis</url>
    <licenses>
      <license>
        <name>MIT</name>
        <url>https://opensource.org/licenses/MIT</url>
      </license>
    </licenses>
    <scm>
      <connection>scm:git:github.com/CatalystCode/project-fortis</connection>
      <developerConnection>scm:git:git@github.com:CatalystCode/project-fortis</developerConnection>
      <url>github.com/CatalystCode/project-fortis</url>
    </scm>
    <developers>
      <developer>
        <id>c-w</id>
        <name>Clemens Wolff</name>
        <email>clewolff@microsoft.com</email>
        <url>http://github.com/c-w</url>
      </developer>
      <developer>
        <id>erikschlegel</id>
        <name>Erik Schlegel</name>
        <email>erisch@microsoft.com</email>
        <url>http://github.com/erikschlegel</url>
      </developer>
      <developer>
        <id>kevinhartman</id>
        <name>Kevin Hartman</name>
        <email>keha@microsoft.com</email>
        <url>http://github.com/kevinhartman</url>
      </developer>
    </developers>
}

credentials += Credentials(
  "Sonatype Nexus Repository Manager",
  "oss.sonatype.org",
  System.getenv("SONATYPE_USER"),
  System.getenv("SONATYPE_PASSWORD"))

organizationName := "Partner Catalyst"
organizationHomepage := Some(url("https://github.com/CatalystCode"))

publishTo := {
  val isSnapshot = version.value.trim.endsWith("SNAPSHOT")
  val nexus = "https://oss.sonatype.org/"
  if (isSnapshot) Some("snapshots" at nexus + "content/repositories/snapshots")
  else            Some("releases" at nexus + "service/local/staging/deploy/maven2")
}

publishMavenStyle := true
publishArtifact in Test := false
useGpg := true
