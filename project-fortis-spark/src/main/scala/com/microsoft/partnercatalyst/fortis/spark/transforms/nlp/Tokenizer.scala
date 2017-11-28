package com.microsoft.partnercatalyst.fortis.spark.transforms.nlp

object Tokenizer {
  @transient private lazy val wordTokenizer = """\b""".r

  def apply(sentence: String): Seq[String] = {
    if (sentence.isEmpty) {
      return Seq()
    }

    wordTokenizer.split(sentence).toSeq
  }
}
