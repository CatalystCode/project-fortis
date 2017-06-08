package com.microsoft.partnercatalyst.fortis.spark.transforms.nlp

object Tokenizer {
  @transient private lazy val wordTokenizer = """\b""".r

  def apply(sentence: String): Seq[String] = {
    wordTokenizer.split(sentence).toSeq
  }
}
