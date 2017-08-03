DROP KEYSPACE IF EXISTS fortis;
CREATE KEYSPACE fortis WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

/******************************************************************************
 * Types
 *****************************************************************************/

DROP TYPE IF EXISTS computedgender;
CREATE TYPE computedgender (
    male_mentions bigint,
    female_mentions bigint
);

DROP TYPE IF EXISTS sentiment;
CREATE TYPE sentiment (
    neg_avg float
);

DROP TYPE IF EXISTS computedentities;
CREATE TYPE computedentities (
    name text,
    externalsource text,
    externalrefid text,
    count bigint
);

DROP TYPE IF EXISTS place;
CREATE TYPE place (
    placeid text,
    centroidlat double, 
    centroidlon double
);

DROP TYPE IF EXISTS features;
CREATE TYPE features (
    mentions bigint,
    sentiment frozen<sentiment>,
    gender frozen<computedgender>,
    entities frozen<list<computedentities>>,
    keywords frozen<list<text>>,
    places frozen<list<place>>
);

/******************************************************************************
 * Tables
 *****************************************************************************/

DROP TABLE IF EXISTS watchlist;
CREATE TABLE watchlist(
    topicid uuid,
    topic text,
    lang_code text,
    translations map<text, text>,
    insertiontime timestamp,
    PRIMARY KEY (topic, lang_code)
);

DROP TABLE IF EXISTS blacklist;
CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    PRIMARY KEY (id)
);

DROP TABLE IF EXISTS sitesettings;
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

DROP TABLE IF EXISTS streams;
CREATE TABLE streams (
    streamid uuid,
    pipelinekey text,
    pipelinelabel text,
    pipelineicon text,
    streamfactory text,
    params frozen<map<text, text>>,
    PRIMARY KEY (pipelinekey, streamid)
);

DROP TABLE IF EXISTS trustedsources;
CREATE TABLE trustedsources (   
   externalsourceid text,
   sourcetype text,
   pipelinekey text,
   rank int,
   insertiontime timestamp,
   PRIMARY KEY (pipelinekey, externalsourceid, sourcetype, rank)
);

DROP TABLE IF EXISTS conjunctivetopics;
CREATE TABLE conjunctivetopics (
    topic text,
    conjunctivetopic text,
    mentioncount bigint,
    PRIMARY KEY(topic, conjunctivetopic)
);

DROP TABLE IF EXISTS populartopics;
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
    mentioncount bigint,
    insertiontime timestamp,
    PRIMARY KEY ((periodtype, pipelinekey, externalsourceid, tilez, topic, period), tilex, tiley, periodstartdate, periodenddate)
);

DROP TABLE IF EXISTS computedtiles;
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
    placeids frozen<set<text>>,
    insertiontime timestamp,
    conjunctiontopics tuple<text, text, text>,
    PRIMARY KEY ((periodtype, conjunctiontopics, tilez, period), tilex, tiley, periodstartdate, periodenddate, pipelinekey, externalsourceid)
);

DROP TABLE IF EXISTS popularplaces;
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
    mentioncount bigint,
    insertiontime timestamp,
    avgsentiment float,
    PRIMARY KEY ((period, periodtype, pipelinekey, externalsourceid, conjunctiontopic1, conjunctiontopic2, conjunctiontopic3), mentioncount, periodstartdate, periodenddate, centroidlat, centroidlon)
) WITH CLUSTERING ORDER BY (mentioncount DESC, periodstartdate DESC, periodenddate DESC, centroidlat DESC, centroidlon DESC);

DROP TABLE IF EXISTS eventtopics;
CREATE TABLE eventtopics(
    eventids set<text>,
    topic text,
    eventtime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((topic), pipelinekey, externalsourceid, eventtime)
);

DROP TABLE IF EXISTS eventplaces;
CREATE TABLE eventplaces(
    eventids set<text>,
    conjunctiontopic1 text,
    conjunctiontopic2 text,
    conjunctiontopic3 text,
    placeid text,
    eventtime timestamp,
    pipelinekey text,
    externalsourceid text,
    PRIMARY KEY ((placeid), conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, pipelinekey, externalsourceid, eventtime)
);

DROP TABLE IF EXISTS events;
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
    fulltext, /* conjunction of title and body to enable querying of both at the same time */
    PRIMARY KEY ((pipelinekey, eventid)));

/**
 * Allows for linking the batchid to saveToCassandra spark call so we can filter out dupes from the original rdd.
**/
DROP MATERIALIZED VIEW IF EXISTS eventbatches;
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
DROP TABLE IF EXISTS computedtrends;
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
    PRIMARY KEY ((pipelinekey, periodtype, tilez, period), tilex, tiley, topic)
) WITH CLUSTERING ORDER BY (tilex ASC, tiley ASC, topic ASC);

/******************************************************************************
 * Views
 *****************************************************************************/

DROP MATERIALIZED VIEW IF EXISTS popularsources;
CREATE MATERIALIZED VIEW popularsources
AS SELECT periodtype, conjunctiontopics, tilez, externalsourceid, period, pipelinekey, conjunctiontopics, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopics IS NOT NULL
     AND tilez IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND period IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND conjunctiontopics IS NOT NULL
     AND periodtype IS NOT NULL
     AND tilez IS NOT NULL
     AND period IS NOT NULL
     AND tilex IS NOT NULL
     AND tiley IS NOT NULL
     AND periodstartdate IS NOT NULL
     AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopics, tilez, externalsourceid, period), tilex, tiley, periodstartdate, periodenddate, pipelinekey);

DROP MATERIALIZED VIEW IF EXISTS timeseries;
CREATE MATERIALIZED VIEW timeseries
AS SELECT periodtype, conjunctiontopics, tilez, externalsourceid, period, pipelinekey, conjunctiontopics, periodtype, tilez, period, tilex, tiley, periodstartdate, periodenddate, mentioncount, avgsentiment
   FROM computedtiles
   WHERE periodtype IS NOT NULL
     AND conjunctiontopics IS NOT NULL
     AND tilez IS NOT NULL
     AND externalsourceid IS NOT NULL
     AND period IS NOT NULL
     AND pipelinekey IS NOT NULL
     AND conjunctiontopics IS NOT NULL
     AND periodtype IS NOT NULL
     AND tilez IS NOT NULL
     AND period IS NOT NULL
     AND tilex IS NOT NULL
     AND tiley IS NOT NULL
     AND periodstartdate IS NOT NULL
     AND periodenddate IS NOT NULL
PRIMARY KEY ((periodtype, conjunctiontopics, tilez, period), tilex, tiley, pipelinekey, externalsourceid, periodstartdate, periodenddate);

/******************************************************************************
 * Indices
 *****************************************************************************/

DROP INDEX IF EXISTS events_fulltext_idx;
CREATE CUSTOM INDEX ON events (fulltext) USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
'mode': 'CONTAINS',
'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
'analyzed': 'true',
'tokenization_enable_stemming': 'true',
'tokenization_normalize_lowercase': 'true'
};
