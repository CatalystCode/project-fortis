package com.microsoft.partnercatalyst.fortis.spark.transforms.topic

trait KeyphraseExtractor {

  def extractKeyphrases(input: String): Set[Keyphrase]

}

case class Keyphrase(matchedPhrase: String, fragments:Set[String], count: Int)
