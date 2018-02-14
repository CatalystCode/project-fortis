package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import com.microsoft.partnercatalyst.fortis.spark.dto.{Geofence, Location}
import com.microsoft.partnercatalyst.fortis.spark.logging.FortisTelemetry.{get => Log}
import com.microsoft.partnercatalyst.fortis.spark.transforms.language.TextNormalizer
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.client.FeatureServiceClient
import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.dto.FeatureServiceFeature.toLocation

import scala.collection.mutable

@SerialVersionUID(100L)
class LocationsExtractorFactory(
  featureServiceClient: FeatureServiceClient,
  languages: Seq[String],
  geofence: Geofence,
  layersIncluded: Seq[String] = List("macroregion", "region", "macrocounty", "county", "metroarea", "localadmin", "locality", "borough", "macrohood", "neighbourhood"),
  maxLocationsDefault: Int = Int.MaxValue
) extends Serializable {

  protected var lookup: Map[String, Set[Location]] = _

  def buildLookup(): this.type = {
    val map = mutable.Map[String, Location]()
    featureServiceClient.bbox(geofence, layersIncluded).foreach(feature => {
      val locationName = feature.name.toLowerCase
      val newLocation = toLocation(feature)
      val oldLocation = map.get(locationName).orNull
      if (oldLocation == null) {
        map(locationName) = newLocation
        languages.foreach(language=>{
          map(TextNormalizer(locationName, language)) = newLocation
        })
      } else if (newLocation < oldLocation) {
        map(locationName) = newLocation
        languages.foreach(language=>{
          map(TextNormalizer(locationName, language)) = newLocation
        })
      }
    })

    lookup = map.map(kv => (kv._1, Set(kv._2))).toMap
    Log.logDebug(s"Built lookup for $geofence with ${lookup.size} locations")
    this
  }

  // TODO: make location limit tunable from site settings?
  def create(placeRecognizer: Option[PlaceRecognizer] = None, locationLimit: Int = maxLocationsDefault, ngrams: Int = 3): LocationsExtractor = {
    new LuceneLocationsExtractor(lookup, featureServiceClient, locationLimit, ngrams)
  }

  def fetch(latitude: Double, longitude: Double): Iterable[Location] = {
    val locationsForPoint = featureServiceClient.point(latitude = latitude, longitude = longitude)
    val locationsInGeofence = locationsForPoint.flatMap(location => lookup.get(location.name.toLowerCase)).flatten.toSet
    locationsInGeofence.map(_.copy(confidence = Some(1.0)))
  }
}
