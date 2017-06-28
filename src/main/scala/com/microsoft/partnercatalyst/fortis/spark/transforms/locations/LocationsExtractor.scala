package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.dto.Location
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient

@SerialVersionUID(100L)
class LocationsExtractor private[locations](
  lookup: Map[String, Set[String]],
  featureServiceClient: FeatureServiceClient,
  placeRecognizer: Option[PlaceRecognizer] = None,
  ngrams: Int = 3
) extends Serializable with Loggable {

  def analyze(text: String): Iterable[Location] = {
    if (text.isEmpty) {
      return List()
    }

    val candidatePlaces = extractCandidatePlaces(text).toSet
    val locationsInGeofence = candidatePlaces.flatMap(place => lookup.get(place.toLowerCase)).flatten
    locationsInGeofence.map(wofId => Location(wofId, confidence = Some(0.5)))
  }

  private def extractCandidatePlaces(text: String): Iterable[String] = {
    var candidatePlaces = Iterable[String]()
    if (placeRecognizer.isDefined) {
      candidatePlaces = placeRecognizer.get.extractPlaces(text)
    }
    if (candidatePlaces.isEmpty) {
      logDebug("Falling back to ngrams approach")
      candidatePlaces = StringUtils.ngrams(text, ngrams)
    }
    candidatePlaces
  }
}
