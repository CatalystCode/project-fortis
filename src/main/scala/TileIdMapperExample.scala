import com.microsoft.partnercatalyst.fortis.spark.transforms.locations.TileUtils
import org.apache.spark.{SparkConf, SparkContext}

import scala.collection.mutable

/**
  * Created by erisch on 5/25/2017.
  */
object TileIdMapperExample {
  final val NUM_SAMPLES =100000
  final val DETAIL_ZOOM_DELTA = 5
  final val MAX_ZOOM_LEVEL = 16
  final val MIN_ZOOM_LEVEL = 5

  def map_to_zoom_render_tile(tileTuple: (String, Int)): (String, (String, Int)) = {
    val tile = TileUtils().tile_from_tile_id_str(tileTuple._1)
    //return the tile id 5 levels deep from tileTuple which will be used to render in the heatmap
    (TileUtils().tile_id_from_lat_long(tile.centerLatitude(), tile.centerLongitude(), tile.tileId.zoom - DETAIL_ZOOM_DELTA).tileId,
      (tile.tileId.tileId, tileTuple._2))
  }

  def tile_id_mapper_with_zoom(location: (Double, Double)): List[(String, (String, Int))] = {
    (for (zoom <- MIN_ZOOM_LEVEL to MAX_ZOOM_LEVEL)
      yield (TileUtils().tile_id_from_lat_long(location._1, location._2, zoom).tileId,
            (TileUtils().tile_id_from_lat_long(location._1, location._2, zoom + DETAIL_ZOOM_DELTA).tileId, 1))).toList
  }

  def reduceMutableZoomTileMap(zoomTileTuple: (mutable.Map[String, Int], Int), tileEntry: (String, Int)
                              ): (mutable.Map[String, Int], Int) = {
    val zoomTileId = tileEntry._1
    val zoomTileMap = zoomTileTuple._1
    zoomTileMap(zoomTileId) += 1
    (zoomTileMap, zoomTileTuple._2 + 1)
  }

  def mergeTilePartitionRdds(p1: (mutable.Map[String, Int], Int), p2: (mutable.Map[String, Int], Int)): (mutable.Map[String, Int], Int) = {
    (p1._1 ++ p2._1.map{ case (k,v) => k -> (v + p1._1.getOrElse(k,0)) }, p1._2 + p2._2)
  }

  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("Simple Application").setIfMissing("spark.master", "local[*]")
    val sc = new SparkContext(conf)
    val locationListSamples = List[(Double, Double)]((30.294221,-97.7760937), (30.294221,-97.7760937), (30.4007241,-97.7368647), (30.4007241,-97.7368647), (30.4007241,-97.7368647), (30.4007241,-97.7368647))
    val locationStream = sc.parallelize(locationListSamples)
    val initialMap = (mutable.Map[String, Int]().withDefaultValue(0), 0)
    val countByTileId = locationStream.flatMap(tile_id_mapper_with_zoom)
      .aggregateByKey(initialMap)(reduceMutableZoomTileMap, mergeTilePartitionRdds)
      .foreach(println)
  }
}
