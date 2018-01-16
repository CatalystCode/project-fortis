# project-fortis-spark

## Overview

This repository contains the data ingestion tier of the Fortis architecture,
below highlighted in red in the architecture diagram for the entire system.

![Overview of Fortis architecture with project-fortis-spark responsibility highlighted](https://user-images.githubusercontent.com/1086421/34999220-32304984-faaf-11e7-855e-c2d52244992d.png)

This repository implements a real-time job (Spark Streaming) that listens to
various data feeds (e.g. Twitter, Bing, RSS, Instagram, ...), analyzes and
filters the events and persists them to the Fortis data-store (Cassandra).
