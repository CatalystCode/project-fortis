package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.dto.Location
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.topic.LuceneKeyphraseExtractor

class LuceneLocationsExtractor(
  lookup: Map[String, Set[Location]],
  featureServiceClient: FeatureServiceClient,
  locationLimit: Int = Int.MaxValue,
  ngrams: Int = 3
) extends LocationsExtractor(lookup, featureServiceClient, None, locationLimit, ngrams) {

  lazy private val keyphraseExtractor = new LuceneKeyphraseExtractor("UNKNOWN", lookup.keySet, locationLimit)

  override def analyze(text: String): Iterable[Location] = {
    if (text.isEmpty) {
      return List()
    }
    val matches = keyphraseExtractor.extractKeyphrases(text)
    matches.flatMap(m=>lookup(m.matchedPhrase))
  }
}
