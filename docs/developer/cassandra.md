# Cassandra
Project Fortis uses Cassandra to store configuration data (stream connection info, analysis settings, filtering settings, etc.), as well as processed event information which is used to power the Fortis UI.

This document covers the schema (namespace(s), tables, etc.) employed by Project Fortis, and the function of each of the components that comprise it.

For detailed schema information (field and type information for tables, as well as materialized views), see [the Fortis schema definition](https://github.com/CatalystCode/project-fortis-pipeline/blob/master/ops/storage-ddls/cassandra-setup.cql).

## Custom Namespaces

| Name | Function |
| --- | --- |
| `fortis` | Contains all tables used by the various components of Project Fortis (Spark pipeline, UI, etc.). |

## Tables
** *All tables are in the `fortis` namespace. Therefore, the fully qualified name of any table is `fortis.<tablename>`.*

| Name | Modified By | Function |
| --- | --- | --- |
| `blacklist` | Fortis UI | Used by the Spark pipeline to filter incoming events such that events matching at least one blacklist term will be discarded. |
| `watchlist` | Fortis UI | Acts as a whitelist. Used by the Spark pipeline to filter incoming events such events *not* matching at least one watchlist term will be discarded. |
| `sitesettings` | Fortis UI | Stores various settings related to the configuration of the Fortis system. For example, API keys used by event analysis phases of the Spark pipeline, the geofence by which to limit event ingestion, etc. </p>** *Only 1 entry is expected.* |
| `streams` | Fortis UI | Defines the stream connections to open/attach to the Spark pipeline. Each entry in this table corresponds to exactly one connection. For more information, see [stream configuration details](streams.md). |
| `trustedsources` | Fortis UI | Defines the profiles, users, and pages for each supported source stream type. </p>** *Incoming events not matched by any trusted source will be discarded.* |
| `computedtiles` | Fortis Spark | TODO |
| `heatmap` | Fortis Spark | TODO |
| `popularplaces` | Fortis Spark | TODO |
| `conjunctivetopics` | Fortis Spark | TODO |
| `eventplaces` | Fortis Spark | TODO |
| `computedtrends` | Fortis Spark | TODO |
| `events` | Fortis Spark | TODO |
