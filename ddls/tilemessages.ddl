-- Table: public.tilemessages

-- DROP TABLE public.tilemessages;

CREATE TABLE public.tilemessages
(
  messageid text NOT NULL,
  source text NOT NULL,
  keywords text[] NOT NULL,
  createdtime timestamp with time zone NOT NULL,
  pos_sentiment real,
  geog geography(MultiPoint,4326),
  neg_sentiment real,
  en_sentence text,
  ar_sentence text,
  full_text text,
  link text,
  original_sources text,
  title text,
  orig_language text NOT NULL,
  CONSTRAINT message_pk PRIMARY KEY (messageid, source)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.tilemessages
  OWNER TO "postgres-admin";

-- Index: public."messageKeywordsPK"

-- DROP INDEX public."messageKeywordsPK";

CREATE INDEX "messageKeywordsPK"
  ON public.tilemessages
  USING btree
  (keywords COLLATE pg_catalog."default", createdtime);

-- Index: public."messageLocation"

-- DROP INDEX public."messageLocation";

CREATE INDEX "messageLocation"
  ON public.tilemessages
  USING gist
  (geog);

-- Index: public.tilemessages_ar_sentence_idx

-- DROP INDEX public.tilemessages_ar_sentence_idx;

CREATE INDEX tilemessages_ar_sentence_idx
  ON public.tilemessages
  USING btree
  (ar_sentence COLLATE pg_catalog."default");

-- Index: public.tilemessages_en_sentence_idx

-- DROP INDEX public.tilemessages_en_sentence_idx;

CREATE INDEX tilemessages_en_sentence_idx
  ON public.tilemessages
  USING btree
  (en_sentence COLLATE pg_catalog."default");

-- Index: public.tilemessages_keywords_idx

-- DROP INDEX public.tilemessages_keywords_idx;

CREATE INDEX tilemessages_keywords_idx
  ON public.tilemessages
  USING gin
  (keywords COLLATE pg_catalog."default");

CREATE INDEX tilemessages_source_idx
  ON public.tilemessages(source COLLATE pg_catalog."default");
  