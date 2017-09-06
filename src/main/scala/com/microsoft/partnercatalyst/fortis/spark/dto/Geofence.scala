package com.microsoft.partnercatalyst.fortis.spark.dto

case class Geofence(north: Double, west: Double, south: Double, east: Double) {

  def contains(location: Location): Boolean = {
    location.latitude > south &&
      location.latitude < north &&
    location.longitude > west &&
    location.longitude < east
  }

  def containsAtLeastOne(locations: List[Location]): Boolean = {
    locations.find(contains).isDefined
  }

}