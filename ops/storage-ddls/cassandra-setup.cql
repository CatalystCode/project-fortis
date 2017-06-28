CREATE KEYSPACE fortis
   WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 3};

USE fortis;

CREATE TABLE watchlist(
    keyword text,
    lang_code text,
    translations map<text, text>,
    insertion_time timestamp,
    PRIMARY KEY (keyword, lang_code)
);

CREATE TABLE blacklist(
    id uuid,
    conjunctivefilter frozen<list<text>>,
    PRIMARY KEY (id)
);

CREATE TABLE sitesettings(
    id uuid,
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
    insertion_time timestamp,
    PRIMARY KEY (id, sitename)
);

CREATE INDEX ON sitesettings (sitename);

CREATE TABLE streams (
  pipeline text,
  streamid uuid,
  connector text,
  params frozen<map<text, text>>,
  PRIMARY KEY ((pipeline), streamid)
);

CREATE TABLE trustedsources (
   sourceid text,
   sourcetype text,
   pipeline text,
   rank int,
   insertion_time timestamp,
   PRIMARY KEY ((pipeline), sourceid, sourcetype)
);

CREATE INDEX ON trustedsources (rank);

CREATE TYPE computedsentiment (
    pos_avg float,
    neg_avg float
);

CREATE TYPE computedgender (
    male_mentions int,
    female_mentions int
);

CREATE TYPE computedentities (
    name text,
    externalsource text,
    externalrefid text,
    count float
);

CREATE TYPE features (
    mentions int,
    sentiment frozen<computedsentiment>,
    gender frozen<computedgender>,
    entities frozen<set<computedentities>>
);

CREATE TABLE computedtiles (
    tilex int,
    tiley int,
    tilez int,
    tileid text,
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipeline text,
    sourceid text,
    topic text,
    topiclangcode text,
    insertion_time timestamp,
    heatmap text,
    placeids frozen<set<text>>,
    computedfeatures frozen<features>,
    PRIMARY KEY ((tilex, tiley, tilez), periodstartdate, periodenddate, pipeline, sourceid, topic)
);

CREATE INDEX ON computedtiles (period);
CREATE INDEX ON computedtiles (computedfeatures);
CREATE INDEX ON computedtiles (periodtype);

CREATE TABLE computedplaces (
    placeid text,
    placename text,
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipeline text,
    sourceid text,
    topic text,
    topiclangcode text,
    insertion_time timestamp,
    computedfeatures frozen<features>,
    PRIMARY KEY ((placeid), periodstartdate, periodenddate, pipeline, sourceid, topic)
);

CREATE INDEX ON computedplaces (period);
CREATE INDEX ON computedplaces (computedfeatures);
CREATE INDEX ON computedplaces (periodtype);

CREATE TABLE computedtopics (
    periodstartdate timestamp,
    periodenddate timestamp,
    periodtype text,
    period text,
    pipeline text,
    sourceid text,
    topic text,
    topiclangcode text,
    insertion_time timestamp,
    computedfeatures frozen<features>,
    PRIMARY KEY ((topic), pipeline, periodstartdate, periodenddate, sourceid)
);

CREATE INDEX ON computedtopics (period);
CREATE INDEX ON computedtopics (computedfeatures);
CREATE INDEX ON computedtopics (periodtype);

CREATE TABLE events(
    id uuid,
    externalid text,
    pipeline text,
    title text,
    sourceurl text,
    detectedplaceids frozen<set<text>>,
    sourceid text,
    detectedkeywords frozen<set<text>>,
    eventlangcode text,
    messagebody text,
    computedfeatures frozen<features>,
    insertion_time timestamp,
    event_time timestamp,
    PRIMARY KEY (pipeline, externalid)
);

CREATE INDEX ON events (FULL(detectedplaceids));
CREATE INDEX ON events (FULL(detectedkeywords));
CREATE INDEX ON events (computedfeatures);
CREATE INDEX ON events (eventlangcode);
CREATE INDEX ON events (event_time);