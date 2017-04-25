package com.microsoft.partnercatalyst.fortis.spark.sources.instagram.dto

case class Image(url: String, width: Int, height: Int)
case class Instagram(thumbnail: Image, image: Image, id: String, link: String, createdAtEpoch: Long)
