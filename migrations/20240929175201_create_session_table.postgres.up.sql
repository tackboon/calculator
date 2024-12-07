-- Table: public.sessions

-- DROP TABLE IF EXISTS public.sessions;

CREATE TABLE IF NOT EXISTS public.sessions
(
    user_id integer NOT NULL,
    session_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    access_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    refresh_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at integer NOT NULL,
    deleted_at integer NOT NULL,
    refreshed_at integer NOT NULL,
    last_ip inet NOT NULL,
    location_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    device_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (user_id, session_id)
)

CREATE INDEX IF NOT EXISTS idx_refreshed_at
    ON public.sessions USING btree
    (refreshed_at ASC NULLS LAST)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_deleted_at
    ON public.sessions USING btree
    (deleted_at ASC NULLS LAST)
    WITH (deduplicate_items=True)
    TABLESPACE pg_default;