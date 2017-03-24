-- Table: public.tiles

-- DROP TABLE public.tiles;

CREATE TABLE public.tiles
(
  tileid text NOT NULL,
  keyword text NOT NULL,
  period text NOT NULL,
  periodtype text NULL,
  perioddate timestamp NULL,
  source text NOT NULL,
  pos_sentiment real,
  mentions integer,
  geog geography(Point,4326),
  zoom integer,
  layertype text,
  layer text NOT NULL,
  neg_sentiment real,
  CONSTRAINT id PRIMARY KEY (tileid, layer, keyword, period, source)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.tiles
  OWNER TO "postgres-admin";

-- Index: public."tileKey"

-- DROP INDEX public."tileKey";

CREATE INDEX "tilePoint"
  ON public.tiles
  USING gist
  (geog);

CREATE INDEX "tileSource"
  ON public.tiles
  USING btree
  (source COLLATE pg_catalog."default");

CREATE INDEX "tileKeyword"
  ON public.tiles
  USING btree
  (keyword COLLATE pg_catalog."default");

CREATE INDEX "tileLayer"
  ON public.tiles
  USING btree
  (layer COLLATE pg_catalog."default");

  CREATE INDEX "tileLayerType"
  ON public.tiles
  USING btree
  (layertype COLLATE pg_catalog."default");

CREATE INDEX "tilePeriod"
  ON public.tiles
  USING btree
  (period COLLATE pg_catalog."default");

CREATE INDEX "periodType"
  ON public.tiles
  USING btree
  (periodtype COLLATE pg_catalog."default");

CREATE INDEX "periodDate"
  ON public.tiles
  USING btree
  (perioddate)
  
CREATE INDEX "tileZoom"
  ON public.tiles
  USING btree
  (zoom);