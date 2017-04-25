package com.microsoft.partnercatalyst.fortis.spark.instagram.dto

case class JsonInstagramResponse(data: List[JsonInstagramItem])
case class JsonInstagramItem(created_time: String, `type`: String, images: JsonInstagramImages, id: String, link: String)
case class JsonInstagramImages(standard_resolution: JsonInstagramImage, thumbnail: JsonInstagramImage)
case class JsonInstagramImage(url: String, width: Int, height: Int)
