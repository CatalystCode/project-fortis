package com.microsoft.partnercatalyst.fortis.spark.transforms.image.dto

case class Tag(name: String, confidence: Double)
case class ImageAnalysis(tags: List[Tag], description: Option[String], celebrities: List[Tag], landmarks: List[Tag])
