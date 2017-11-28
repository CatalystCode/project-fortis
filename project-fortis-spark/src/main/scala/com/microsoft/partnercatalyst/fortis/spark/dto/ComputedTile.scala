package com.microsoft.partnercatalyst.fortis.spark.dto

case class ComputedTile(periodstartdate: Long,
                        periodenddate: Long,
                        periodtype: String,
                        period: String,
                        pipelinekey: String,
                        tilez: Int,
                        tilex: Int,
                        tiley: Int,
                        externalsourceid: String,
                        mentioncount: Int,
                        avgsentiment: Int,
                        heatmap: String,
                        placeids: Seq[String],
                        insertiontime: Long,
                        conjunctiontopics: (Option[String], Option[String], Option[String])) extends Serializable
