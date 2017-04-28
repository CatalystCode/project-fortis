package com.microsoft.partnercatalyst.fortis.spark.transforms

import com.microsoft.partnercatalyst.fortis.spark.transforms.image.dto.ImageAnalysis

case class AnalyzedItem[T](originalItem: T, analysis: ImageAnalysis)

