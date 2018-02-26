DROP KEYSPACE IF EXISTS fortis;
CREATE KEYSPACE fortis WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
};

-- *****************************************************************************
-- * Down migration
-- *****************************************************************************

DROP TABLE IF EXISTS fortis.conjunctivetopics;
DROP TABLE IF EXISTS fortis.computedtiles;
DROP TABLE IF EXISTS fortis.heatmap;
DROP TABLE IF EXISTS fortis.popularsources;
DROP TABLE IF EXISTS fortis.populartopics;
DROP TABLE IF EXISTS fortis.popularplaces;
DROP TABLE IF EXISTS fortis.eventplacesbysource;
DROP TABLE IF EXISTS fortis.events;
DROP TABLE IF EXISTS fortis.computedtrends;
DROP TABLE IF EXISTS fortis.eventplaces;
DROP TABLE IF EXISTS fortis.eventsbypipeline;


-- *****************************************************************************
-- * Data tables
-- *****************************************************************************

-- *****************************************************************************
-- * Partition key: (pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype)
-- *
-- * Spark partitions TileRow data once according to the above partition key and 
-- * performs writes to these tables without shuffling.
-- *****************************************************************************

CREATE TABLE fortis.computedtiles (
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text,
    periodtype text,
    perioddate timestamp,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype), perioddate)
);

CREATE TABLE fortis.heatmap (
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text,
    periodtype text,
    perioddate timestamp,
    heatmaptileid text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype), perioddate, heatmaptileid)
);

CREATE TABLE fortis.popularplaces (
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text,
    periodtype text,
    perioddate timestamp,
    placeid text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype), perioddate, placeid)
);

CREATE TABLE fortis.conjunctivetopics (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    externalsourceid text,
    topic text,
    conjunctivetopic text,
    mentioncount counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, tileid), perioddate, conjunctivetopic)
);

CREATE TABLE fortis.eventplaces(
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text, -- TODO: should this be part of the Primary Key?
    eventtime timestamp,
    eventid text,
    placeid text,
    centroidlat double,
    centroidlon double,
    insertiontime timestamp,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid), eventtime, eventid, placeid)
) WITH CLUSTERING ORDER BY (eventtime DESC);

CREATE TABLE fortis.events(
    eventid text,
    sourceeventid text,
    batchid uuid,
    pipelinekey text,
    title text,
    sourceurl text,
    externalsourceid text,
    eventlangcode text,
    body text,
    imageurl text,
    summary text,
    computedfeatures_json text,
    insertiontime timestamp,
    eventtime timestamp,
    PRIMARY KEY (eventid)
);

CREATE TABLE fortis.populartopics(
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text, -- always set to ''
    conjunctiontopic3 text, -- always set to ''
    tilez int,
    tileid text,
    externalsourceid text,
    periodtype text,
    perioddate timestamp,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype), perioddate)
) WITH CLUSTERING ORDER BY (perioddate DESC);

CREATE TABLE fortis.eventplacesbysource(
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text,
    periodtype text, -- always set to 'day'
    eventtime timestamp,
    eventid text,
    placeid text,
    centroidlat double,
    centroidlon double,
    insertiontime timestamp,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, externalsourceid, periodtype), eventtime, eventid, placeid)
) WITH CLUSTERING ORDER BY (eventtime DESC);

CREATE TABLE fortis.popularsources (
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    periodtype text,
    perioddate timestamp,
    externalsourceid text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid, periodtype), perioddate, externalsourceid)
) WITH CLUSTERING ORDER BY (perioddate DESC);

CREATE TABLE fortis.eventsbypipeline(
    pipelinekey text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tilez int,
    tileid text,
    externalsourceid text,
    eventtime timestamp,
    eventid text,
    placeid text,
    centroidlat double,
    centroidlon double,
    insertiontime timestamp,
    PRIMARY KEY ((pipelinekey, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez), eventtime, eventid, tileid, placeid)
) WITH CLUSTERING ORDER BY (eventtime DESC);

