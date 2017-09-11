package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

import org.scalactic.TolerantNumerics
import org.scalatest.FlatSpec
import org.scalactic._

class TileUtilsSpec extends FlatSpec {

  implicit val doubleEquality = TolerantNumerics.tolerantDoubleEquality(0.01)

  "tile_id_from_lat_long" should "return a valid id" in {
    assert(TileUtils.tile_id_from_lat_long(0, 12, 8) == new TileId("8_128_136"))
  }

  "tile_from_lat_long" should "return a valid tile" in {
    assert(TileUtils.tile_from_lat_long(0, 12, 8) == new Tile(new TileId("8_128_136"), 0.0, -1.4061088354351505, 11.25, 12.65625))
  }

  "row_from_latitude" should "return NaN for invalid latitude" in {
    val row = TileUtils.row_from_latitude(3000, 8)
    assert(row.isNaN)
  }

  "column_from_longitude" should "return value even for invalid longitude" in {
    assert(TileUtils.column_from_longitude(3000, 8) === 2261.0)
  }

  "row_from_latitude" should "return zero for zero latitude" in {
    assert(TileUtils.row_from_latitude(0, 8) === 128.0)
  }

  "column_from_longitude" should "return zero for zero longitude" in {
    assert(TileUtils.column_from_longitude(0, 8) === 128.0)
  }

  "row_from_latitude" should "return valid number for valid latitude" in {
    assert(TileUtils.row_from_latitude(12, 8) === 119.0)
  }

  "column_from_longitude" should "return value for valid longitude" in {
    assert(TileUtils.column_from_longitude(12, 8) === 136.0)
  }

  "latitude_from_row" should "return valid value from zero row" in {
    assert(TileUtils.latitude_from_row(0, 8) === 85.0511287798066)
  }

  "latitude_from_row" should "return valid value from non-zero row" in {
    assert(TileUtils.latitude_from_row(119, 8) === 12.554563528593665)
  }

  "longitude_from_column" should "return valid value from zero row" in {
    assert(TileUtils.longitude_from_column(0, 8) === -180.0)
  }

  "longitude_from_column" should "return valid value from non-zero row" in {
    assert(TileUtils.longitude_from_column(119, 8) === -12.65625)
  }
}
