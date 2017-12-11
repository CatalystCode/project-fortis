# project-fortis-spark

A repository for Project Fortis's data processing pipeline, built on Apache Spark.

## What's this? ##

This project contains a Spark Streaming job that ingests data into the Fortis system. Specifically, we:

1. Ingest data in real time from sources such as Twitter, Facebook, Online Radio, Newspapers, Instagram, TadaWeb, and so forth.
2. Analyze and augment the raw data with intelligence like sentiment analysis, entity extraction, place recognition, or image understanding.
3. Narrow down the stream of events based on user-defined geo-areas, target keywords and blacklisted terms.
4. Perform trend detection and aggregate the metrics that back Project Fortis.

At the end of the ingestion pipeline, we publish the events and various aggregations to Cassandra.
