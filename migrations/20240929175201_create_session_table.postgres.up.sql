-- Table: public.sessions

-- DROP TABLE IF EXISTS public.sessions;

CREATE TABLE IF NOT EXISTS public.sessions
(
    user_id integer NOT NULL,
    session_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at integer NOT NULL,
    last_online integer NOT NULL,
    last_ip inet NOT NULL,
    location_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    device_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    device_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (user_id, session_id)
)

-- Index: idx_last_online

-- DROP INDEX IF EXISTS public.idx_last_online;

CREATE INDEX IF NOT EXISTS idx_last_online
    ON public.sessions USING btree
    (last_online ASC NULLS LAST)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;
