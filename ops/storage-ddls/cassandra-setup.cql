DROP KEYSPACE IF EXISTS fortis;
CREATE KEYSPACE fortis WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

/******************************************************************************
 * Down migration
 *****************************************************************************/
DROP MATERIALIZED VIEW IF EXISTS eventbatches;
DROP MATERIALIZED VIEW IF EXISTS popularsources;
DROP MATERIALIZED VIEW IF EXISTS populartopics;
DROP MATERIALIZED VIEW IF EXISTS eventplacesbysource;
DROP INDEX IF EXISTS events_fulltext_idx;

DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS blacklist;
DROP TABLE IF EXISTS sitesettings;
DROP TABLE IF EXISTS streams;
DROP TABLE IF EXISTS trustedsources;
DROP TABLE IF EXISTS conjunctivetopics;
DROP TABLE IF EXISTS computedtiles;
DROP TABLE IF EXISTS heatmap;
DROP TABLE IF EXISTS popularplaces;
DROP TABLE IF EXISTS eventplaces;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS computedtrends;

DROP TYPE IF EXISTS features;
DROP TYPE IF EXISTS computedgender;
DROP TYPE IF EXISTS sentiment;
DROP TYPE IF EXISTS computedentities;
DROP TYPE IF EXISTS place;

/******************************************************************************
 * Up migration
 *****************************************************************************/

/**************************************
 * Types
 *************************************/

CREATE TYPE computedgender (
    male_mentions bigint,
    female_mentions bigint
);

CREATE TYPE sentiment (
    neg_avg double
);

CREATE TYPE computedentities (
    name text,
    externalsource text,
    externalrefid text,
    count bigint
);

CREATE TYPE place (
    placeid text,
    centroidlat double,
    centroidlon double
);

CREATE TYPE features (
    mentions bigint,
    sentiment frozen<sentiment>,
    entities frozen<list<computedentities>>,
    keywords frozen<list<text>>,
    places frozen<list<place>>
);

/**************************************
 * Tables
 *************************************/

CREATE TABLE watchlist(
    topicid uuid,
    topic text,
    lang_code text,
    translations map<text, text>,
    category text,
    insertiontime timestamp,
    PRIMARY KEY ((topic, lang_code), category)
);

CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    islocation boolean,
    PRIMARY KEY (id)
);

CREATE TABLE sitesettings(
    sitename text,
    geofence list<double>,
    languages set<text>,
    defaultlanguage text,
    defaultzoom int,
    featureservicenamespace text,
    title text,
    logo text,
    translationsvctoken text,
    cogspeechsvctoken text,
    cogvisionsvctoken text,
    cogtextsvctoken text,
    insertiontime timestamp,
    PRIMARY KEY (sitename)
);

CREATE TABLE streams (
    streamid uuid,
    pipelinekey text,
    pipelinelabel text,
    pipelineicon text,
    streamfactory text,
    params frozen<map<text, text>>,
    enabled boolean,
    PRIMARY KEY (pipelinekey, streamid)
);

CREATE TABLE trustedsources (
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   displayname text,
   reportingcategory text,
   insertiontime timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

CREATE TABLE computedtiles (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    externalsourceid text,
    mentioncount bigint,
    avgsentimentnumerator bigint,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, externalsourceid, tileid), perioddate)
);

CREATE TABLE heatmap (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    tilez int,
    tileid text,
    heatmaptileid text,
    externalsourceid text,
    mentioncount counter,
    avgsentimentnumerator counter,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, externalsourceid, tileid), perioddate, heatmaptileid)
);

CREATE TABLE popularplaces (
    perioddate timestamp,
    periodtype text,
    pipelinekey text,
    externalsourceid text,
    placeid text,
    tilez int,
    tileid text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, tileid), perioddate, placeid)
);

CREATE TABLE conjunctivetopics (
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

CREATE TABLE eventplaces(
    eventid text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    tileid text,
    tilez int,
    centroidlat double,
    centroidlon double,
    placeid text,
    insertiontime timestamp,
    eventtime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, tilez, tileid), eventtime, eventid, placeid)
) WITH CLUSTERING ORDER BY (eventtime DESC);

CREATE TABLE computedtrends(
    topic text,
    pipelinekey text,
    periodstartdate timestamp,
    periodtype text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    score float,
    insertion_time timestamp,
    PRIMARY KEY ((pipelinekey, periodtype, tilez, period), topic, tilex, tiley)
) WITH CLUSTERING ORDER BY (topic ASC, tilex ASC, tiley ASC);

CREATE TABLE events(
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
    computedfeatures frozen<features>,
    insertiontime timestamp,
    eventtime timestamp,
    topics frozen<set<text>>,
    placeids frozen<set<text>>,
    fulltext text, /* conjunction of title and body to enable querying of both at the same time */
    PRIMARY KEY (eventid)
);

/**************************************
 * Views
 *************************************/

CREATE MATERIALIZED VIEW populartopics
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, externalsourceid, pipelinekey, tilez, 
          tileid, perioddate, mentioncount, avgsentimentnumerator
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 = ''
     AND conjunctiontopic3 = ''
     AND avgsentimentnumerator IS NOT NULL
     AND mentioncount IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND tilez IS NOT NULL
     AND tileid IS NOT NULL
     AND perioddate IS NOT NULL
PRIMARY KEY ((periodtype, externalsourceid, tilez, pipelinekey, tileid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3), perioddate, mentioncount)
WITH CLUSTERING ORDER BY (perioddate DESC, mentioncount DESC);

CREATE MATERIALIZED VIEW eventplacesbysource
AS SELECT eventid, pipelinekey, eventtime, centroidlat, centroidlon, placeid, conjunctiontopic1, 
          conjunctiontopic2, conjunctiontopic3, externalsourceid, tileid, tilez
   FROM eventplaces
   WHERE eventid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND eventtime IS NOT NULL
     AND tileid IS NOT NULL
     AND tilez IS NOT NULL
     AND placeid IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND centroidlat IS NOT NULL
     AND centroidlon IS NOT NULL
PRIMARY KEY ((conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, tilez, externalsourceid, tileid), eventtime, placeid, eventid);

/**
 * Allows for linking the batchid to saveToCassandra spark call so we can filter out dupes from the original rdd.
**/
CREATE MATERIALIZED VIEW eventbatches
AS SELECT batchid, eventid
   FROM events
   WHERE batchid IS NOT NULL
     AND eventid IS NOT NULL
PRIMARY KEY (batchid, eventid);

CREATE MATERIALIZED VIEW popularsources
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, externalsourceid, pipelinekey, 
          tileid, perioddate, mentioncount, avgsentimentnumerator
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND avgsentimentnumerator IS NOT NULL
     AND mentioncount IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND tilez IS NOT NULL
     AND tileid IS NOT NULL
     AND perioddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, pipelinekey, tileid), perioddate, mentioncount, externalsourceid)
WITH CLUSTERING ORDER BY (perioddate DESC, mentioncount DESC);

/**************************************
 * Indices
 *************************************/

CREATE CUSTOM INDEX ON events (fulltext) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true'
};
