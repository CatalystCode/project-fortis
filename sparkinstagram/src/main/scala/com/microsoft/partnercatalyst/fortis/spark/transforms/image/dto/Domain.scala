package com.microsoft.partnercatalyst.fortis.spark.transforms.image.dto

case class AnalyzedImage[T](original: T, analysis: ImageAnalysis)
case class ImageAnalysis(tags: List[String])
