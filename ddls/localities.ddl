-- Table: public.localities

-- DROP TABLE public.localities;

CREATE TABLE public.localities
(
  geonameid bigint NOT NULL,
  originalsource text  NOT NULL DEFAULT 'geoname',
  name text NOT NULL,
  aciiname text NOT NULL,
  alternatenames text,
  country_iso text NOT NULL,
  geog geography(Point,4326),
  elevation integer,
  feature_class character varying(5) NOT NULL,
  adminid integer NOT NULL,
  region text,
  population integer,
  ar_name text,
  ur_name text,
  CONSTRAINT localities_pkey PRIMARY KEY (geonameid,originalsource)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.localities
  OWNER TO "postgres-admin";

-- Index: public.geoname_countrycode

-- DROP INDEX public.geoname_countrycode;

CREATE INDEX geoname_countrycode
  ON public.localities
  USING btree
  (country_iso COLLATE pg_catalog."default");

CREATE INDEX geoname_name
  ON public.localities
  USING btree
  (name COLLATE pg_catalog."default");

CREATE INDEX "localityGeog"
  ON public.localities
  USING gist
  (geog);

