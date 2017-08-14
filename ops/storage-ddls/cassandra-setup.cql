DROP KEYSPACE IF EXISTS fortis;
CREATE KEYSPACE fortis WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

/******************************************************************************
 * Down migration
 *****************************************************************************/
DROP MATERIALIZED VIEW IF EXISTS eventbatches;
DROP MATERIALIZED VIEW IF EXISTS popularsources;
DROP MATERIALIZED VIEW IF EXISTS timeseries;
DROP INDEX IF EXISTS events_fulltext_idx;

DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS blacklist;
DROP TABLE IF EXISTS sitesettings;
DROP TABLE IF EXISTS streams;
DROP TABLE IF EXISTS trustedsources;
DROP TABLE IF EXISTS conjunctivetopics;
DROP TABLE IF EXISTS populartopics;
DROP TABLE IF EXISTS computedtiles;
DROP TABLE IF EXISTS popularplaces;
DROP TABLE IF EXISTS eventtopics;
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
    insertiontime timestamp,
    PRIMARY KEY (topic, lang_code)
);

CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    PRIMARY KEY (id)
);

CREATE TABLE sitesettings(
    sitename text,
    geofence list<double>,
    languages set<text>,
    defaultzoom int,
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
    PRIMARY KEY (pipelinekey, streamid)
);

CREATE TABLE trustedsources (
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   insertiontime timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

CREATE TABLE conjunctivetopics (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    pipelinekey text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    externalsourceid text,
    topic text,
    conjunctivetopic text,
    mentioncount counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, period), conjunctivetopic, tilex, tiley, periodstartdate, periodenddate)
);

CREATE TABLE populartopics (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    pipelinekey text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    externalsourceid text,
    topic text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, period), tilex, tiley, periodstartdate, periodenddate)
);

CREATE TABLE computedtiles (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    pipelinekey text,
    period text,
    tilez int,
    tilex int,
    tiley int,
    externalsourceid text,
    mentioncount bigint,
    avgsentiment float,
    heatmap text,
    insertiontime timestamp,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, period), tilex, tiley, periodstartdate, periodenddate, pipelinekey, externalsourceid)
);

CREATE TABLE popularplaces (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipelinekey text,
    externalsourceid text,
    placeid text,
    centroidlat double,
    centroidlon double,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    mentioncount counter,
    avgsentimentnumerator counter,
    PRIMARY KEY ((period, periodtype, pipelinekey, externalsourceid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3), placeid, centroidlat, centroidlon, periodstartdate, periodenddate)
);

CREATE TABLE eventtopics(
    eventid text,
    topic text,
    eventime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((topic, pipelinekey, externalsourceid), eventime, eventid)
);

CREATE TABLE eventplaces(
    eventid text,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    centroidlat double,
    centroidlon double,
    placeid text,
    insertiontime timestamp,
    eventime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, externalsourceid), centroidlat, centroidlon, eventime, eventid)
);

CREATE TABLE events(
    eventid text,
    batchid uuid,
    pipelinekey text,
    title text,
    sourceurl text,
    externalsourceid text,
    eventlangcode text,
    body text,
    computedfeatures frozen<features>,
    insertiontime timestamp,
    eventtime timestamp,
    topics frozen<set<text>>,
    placeids frozen<set<text>>,
    fulltext text, /* conjunction of title and body to enable querying of both at the same time */
    PRIMARY KEY ((pipelinekey, eventid)));

/**
 * Allows for linking the batchid to saveToCassandra spark call so we can filter out dupes from the original rdd.
**/
CREATE MATERIALIZED VIEW eventbatches
AS SELECT batchid, eventid, pipelinekey, eventtime, computedfeatures, externalsourceid
   FROM events
   WHERE batchid IS NOT NULL
     AND eventid IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND eventtime IS NOT NULL
     AND externalsourceid IS NOT NULL
PRIMARY KEY (batchid, eventid, pipelinekey);

/**
 * Allows for fetching trending topics given a pipeline, period and zoom level.
 *
 * select * from computedtrends
 * where pipelinekey = 'twitter'
 * and periodtype = 'day'
 * and period = '2017-06-20'
 * and tilez = 1
 * and (tilex, tiley) >= (0, 0)
 * and (tilex, and tiley) < (10, 10);
 *
 */
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

/**************************************
 * Views
 *************************************/

CREATE MATERIALIZED VIEW popularsources
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, externalsourceid, period, pipelinekey, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND tilez IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND period IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND periodtype IS NOT NULL
     AND tilez IS NOT NULL
     AND period IS NOT NULL
     AND tilex IS NOT NULL
     AND tiley IS NOT NULL
     AND periodstartdate IS NOT NULL
     AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, externalsourceid, period), pipelinekey, tilex, tiley, periodstartdate, periodenddate);

CREATE MATERIALIZED VIEW timeseries
AS SELECT periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, externalsourceid, period, pipelinekey, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount, avgsentiment
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopic1 IS NOT NULL
     AND conjunctiontopic2 IS NOT NULL
     AND conjunctiontopic3 IS NOT NULL
     AND tilez IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND period IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND periodtype IS NOT NULL
     AND tilez IS NOT NULL
     AND period IS NOT NULL
     AND tilex IS NOT NULL
     AND tiley IS NOT NULL
     AND periodstartdate IS NOT NULL
     AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, tilez, period), pipelinekey, externalsourceid, tilex, tiley, periodstartdate, periodenddate);

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
