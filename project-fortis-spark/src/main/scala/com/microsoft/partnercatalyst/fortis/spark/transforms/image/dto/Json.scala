package com.microsoft.partnercatalyst.fortis.spark.transforms.image.dto

case class JsonImageAnalysisResponse(categories: List[JsonImageCategory], tags: List[JsonImageTag], description: JsonImageDescription, faces: List[JsonImageFace])
case class JsonImageDescription(tags: List[String], captions: List[JsonImageCaption])
case class JsonImageFace(age: Double, gender: String, faceRectangle: JsonFaceRectangle)
case class JsonFaceRectangle(left: Int, top: Int, width: Int, height: Int)
case class JsonImageCaption(text: String, confidence: Double)
case class JsonImageTag(name: String, confidence: Double)
case class JsonImageCategory(name: String, score: Double, detail: Option[JsonImageCategoryDetail])
case class JsonImageCategoryDetail(celebrities: Option[List[JsonImageCelebrity]], landmarks: Option[List[JsonImageLandmark]])
case class JsonImageCelebrity(name: String, confidence: Double, faceRectangle: JsonFaceRectangle)
case class JsonImageLandmark(name: String, confidence: Double)

case class JsonImageAnalysisRequest(url: String)
