package com.microsoft.partnercatalyst.fortis.spark.transforms.locations

object StringUtils {
  def ngrams(text: String, n: Int, sep: String = " "): Seq[String] = {
    val words = text.replaceAll("\\p{P}", sep).split(sep).filter(x => !x.isEmpty)
    val ngrams = Math.min(n, words.length)
    (1 to ngrams).flatMap(i => words.sliding(i).map(_.mkString(sep)))
  }
}
