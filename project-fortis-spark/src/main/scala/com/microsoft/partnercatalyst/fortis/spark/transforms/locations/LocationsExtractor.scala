package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.dto.Location
import com.microsoft.partnercatalyst.fortis.spark.logging.Loggable
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient

@SerialVersionUID(100L)
class LocationsExtractor private[locations](
  lookup: Map[String, Set[Location]],
  featureServiceClient: FeatureServiceClient,
  placeRecognizer: Option[PlaceRecognizer] = None,
  locationLimit: Int = Int.MaxValue,
  ngrams: Int = 3
) extends Serializable with Loggable {

  def analyze(text: String): Iterable[Location] = {
    if (text.isEmpty) {
      return List()
    }

    val candidatePlaces = extractCandidatePlaces(text)
    val locationSetsInGeofence = candidatePlaces.flatMap(place =>
      lookup.get(place._1.toLowerCase).map((_, place._2))
    )

    val locations = locationSetsInGeofence.flatMap(location => location._1.map((_, location._2)))
    val topLocations = locations.sortBy(_._2)(Ordering[Int].reverse).take(locationLimit)

    topLocations.map(_._1.copy(confidence = Some(0.5)))
  }

  private def extractCandidatePlaces(text: String): Seq[(String, Int)] = {
    // TODO: use max heap
    var candidatePlaces = Seq[(String, Int)]()

    if (placeRecognizer.isDefined) {
      candidatePlaces = placeRecognizer.get.extractPlacesAndOccurrence(text)
    }

    // TODO: ngrams will be very expensive on large text. Limit text or use summary only?
    if (candidatePlaces.isEmpty && (placeRecognizer.isEmpty || !placeRecognizer.get.isValid)) {
      logDebug("Falling back to ngrams approach")
      candidatePlaces = StringUtils.ngrams(text, ngrams).groupBy(str => str).mapValues(_.length).toSeq
    }

    candidatePlaces
  }
}
