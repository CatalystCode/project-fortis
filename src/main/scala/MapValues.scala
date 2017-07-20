import org.apache.spark.SparkContext

import scala.collection.mutable

/**
  * Created by erisch on 5/25/2017.
  */
object MapValues {
  def main(args: Array[String]) {

    val sc = new SparkContext("local", "ReduceByKeyToDriver Test")
    val data1 = Array[(String, (String, Int))](("K", ("erik", 1)), ("T", ("erik", 1)),
      ("T", ("erik", 1)), ("W", ("erik", 1)),
      ("W", ("erik", 1)), ("W", ("bill", 1))
    )

    val initialMap = mutable.Map[String, Int]()
    val addToMap = (map: mutable.Map[String, Int], v: (String, Int)) => map += (v._1 -> v._2)
    val mergePartitionSets = (p1: mutable.Map[String, Int], p2: mutable.Map[String, Int]) => p1 ++= p2

    val pairs = sc.parallelize(data1)
    //val result = pairs.reduce((A, B) => (A._1 + "#" + B._1, A._2 + B._2))
    //val result = pairs.fold(("K0",10))((A, B) => (A._1 + "#" + B._1, A._2 + B._2))
    //val result = pairs.partitionBy(new RangePartitioner(2, pairs, true))
    val result = pairs.aggregateByKey(initialMap)(addToMap, mergePartitionSets)


    result.foreach(println)
  }
}
