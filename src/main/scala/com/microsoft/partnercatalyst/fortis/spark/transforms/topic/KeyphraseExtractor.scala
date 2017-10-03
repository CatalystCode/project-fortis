package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

trait KeyphraseExtractor extends Serializable {

  def extractKeyphrases(input: String): Set[Keyphrase]

}

case class Keyphrase(matchedPhrase: String, fragments:Set[String], count: Int)
