

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "backup";


ALTER SCHEMA "backup" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."component_with_user" AS (
	"id" bigint,
	"component_names" "jsonb",
	"description" "text",
	"code" "text",
	"demo_code" "text",
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"user_id" "text",
	"dependencies" "jsonb",
	"is_public" boolean,
	"downloads_count" integer,
	"likes_count" integer,
	"component_slug" "text",
	"name" "text",
	"demo_dependencies" "jsonb",
	"registry" "text",
	"direct_registry_dependencies" "jsonb",
	"demo_direct_registry_dependencies" "jsonb",
	"preview_url" "text",
	"license" "text",
	"user_data" "jsonb"
);


ALTER TYPE "public"."component_with_user" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."components_dependencies_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  PERFORM update_component_dependencies_closure(NEW.id);
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."components_dependencies_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  UPDATE public.components
  SET likes_count = likes_count - 1
  WHERE id = OLD.component_id;

  RETURN OLD;
END;$$;


ALTER FUNCTION "public"."decrement_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_component"("component_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    deleted BOOLEAN;
BEGIN
    DELETE FROM component_tags WHERE component_id = $1;
    DELETE FROM components WHERE id = $1;
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN deleted > 0;
END;
$_$;


ALTER FUNCTION "public"."delete_component"("component_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_component_by_slug"("user_username" "text", "component_slug_param" "text") RETURNS TABLE("component_id" bigint, "component_name" "jsonb", "description" "text", "code" "text", "demo_code" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_id" "uuid", "install_url" "text", "dependencies" "jsonb", "is_public" boolean, "downloads_count" integer, "likes_count" integer, "component_slug" "text", "demo_component_name" "text", "name" "text", "demo_dependencies" "jsonb", "internal_dependencies" "jsonb", "preview_url" "text", "license" "text", "user_data" "jsonb", "tags" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS component_id,
        c.component_name,
        c.description,
        c.code,
        c.demo_code,
        c.created_at AT TIME ZONE 'UTC' AS created_at,
        c.updated_at AT TIME ZONE 'UTC' AS updated_at,
        c.user_id,
        c.install_url,
        c.dependencies,
        c.is_public,
        c.downloads_count,
        COALESCE(l.likes_count, 0) AS likes_count,
        c.component_slug,
        c.demo_component_name,
        c.name,
        c.demo_dependencies,
        c.internal_dependencies,
        c.preview_url,
        c.license,
        row_to_json(u) AS user_data,
        (
            SELECT json_agg(t)
            FROM (
                SELECT tags.name, tags.slug
                FROM component_tags
                JOIN tags ON component_tags.tag_id = tags.id
                WHERE component_tags.component_id = c.id
            ) t
        ) AS tags
    FROM 
        components AS c
    JOIN 
        users AS u ON c.user_id = u.id
    LEFT JOIN (
        SELECT component_id, COUNT(*) AS likes_count
        FROM component_likes
        GROUP BY component_id
    ) l ON l.component_id = c.id
    WHERE 
        c.component_slug = component_slug_param
        AND u.username = user_username;
END;
$$;


ALTER FUNCTION "public"."get_component_by_slug"("user_username" "text", "component_slug_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  UPDATE public.components
  SET likes_count = likes_count + 1
  WHERE id = NEW.component_id;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."increment_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trigger_operation"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  RETURN (SELECT TRUE FROM pg_trigger WHERE tgrelid = TG_RELID AND tgname = TG_NAME);
END;$$;


ALTER FUNCTION "public"."is_trigger_operation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."requesting_user_id"() RETURNS "text"
    LANGUAGE "sql"
    AS $$SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
)::text;$$;


ALTER FUNCTION "public"."requesting_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_components"("search_query" "text") RETURNS SETOF "public"."component_with_user"
    LANGUAGE "plpgsql"
    AS $$

BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.component_names,
        c.description,
        c.code,
        c.demo_code,
        c.created_at AT TIME ZONE 'UTC' AS created_at,  -- Cast to timestamp with time zone
        c.updated_at AT TIME ZONE 'UTC' AS updated_at,  -- Cast to timestamp with time zone
        c.user_id,
        c.dependencies,
        c.is_public,
        c.downloads_count,
        c.likes_count,
        c.component_slug,
        c.name,
        c.demo_dependencies,
        c.registry,
        c.direct_registry_dependencies,
        c.demo_direct_registry_dependencies,
        c.preview_url,
        c.license,
        row_to_json(u)::jsonb AS user_data
    FROM
        components AS c
    JOIN
        users AS u ON c.user_id = u.id
    WHERE
        c.fts @@ to_tsquery('english', search_query || ':*');
END; 
$$;


ALTER FUNCTION "public"."search_components"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_dependencies_closure"("p_component_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  direct_deps TEXT[];
  dep TEXT;
  dep_username TEXT;
  dep_slug TEXT;
  dep_component_id INTEGER;
BEGIN
  -- Delete existing dependencies for this component
  DELETE FROM component_dependencies_closure WHERE component_id = p_component_id;

  -- Initialize the closure table with the component itself (depth 0)
  INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth)
  VALUES (p_component_id, p_component_id, 0);

  -- Get direct dependencies from the component
  SELECT ARRAY(SELECT jsonb_array_elements_text(direct_registry_dependencies)) INTO direct_deps
  FROM components WHERE id = p_component_id;

  -- Loop through each direct dependency
  FOREACH dep IN ARRAY direct_deps
  LOOP
    -- Split 'username/slug' into 'dep_username' and 'dep_slug'
    dep_username := split_part(dep, '/', 1);
    dep_slug := split_part(dep, '/', 2);

    -- Find the component ID of the dependency
    SELECT c.id INTO dep_component_id
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE u.username = dep_username AND c.component_slug = dep_slug
    LIMIT 1;

    IF dep_component_id IS NOT NULL THEN
      -- Insert direct dependency (depth 1)
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth)
      VALUES (p_component_id, dep_component_id, 1)
      ON CONFLICT DO NOTHING;

      -- Insert indirect dependencies from the dependency's closure table
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth)
      SELECT p_component_id, cd.dependency_component_id, cd.depth + 1
      FROM component_dependencies_closure cd
      WHERE cd.component_id = dep_component_id
      ON CONFLICT DO NOTHING;
    ELSE
      RAISE NOTICE 'Dependency not found for %/%', dep_username, dep_slug;
    END IF;
  END LOOP;
END;$$;


ALTER FUNCTION "public"."update_component_dependencies_closure"("p_component_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_dependencies_closure"("p_component_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  direct_deps TEXT[];
  demo_direct_deps TEXT[];
  dep TEXT;
  dep_username TEXT;
  dep_slug TEXT;
  dep_component_id BIGINT;
BEGIN
  -- Delete existing dependencies for this component
  DELETE FROM component_dependencies_closure 
  WHERE component_id = p_component_id;

  -- Initialize the closure table with the component itself (depth 0)
  INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
  VALUES (p_component_id, p_component_id, 0, FALSE);

  -- Get direct dependencies from the component
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(direct_registry_dependencies)
  ) INTO direct_deps
  FROM components 
  WHERE id = p_component_id;

  -- Get demo direct dependencies from the component
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(demo_direct_registry_dependencies)
  ) INTO demo_direct_deps
  FROM components 
  WHERE id = p_component_id;

  -- Process direct dependencies
  FOREACH dep IN ARRAY direct_deps
  LOOP
    -- Split 'username/slug' into 'dep_username' and 'dep_slug'
    dep_username := split_part(dep, '/', 1);
    dep_slug := split_part(dep, '/', 2);

    -- Find the component ID of the dependency
    SELECT c.id INTO dep_component_id
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE u.username = dep_username 
      AND c.component_slug = dep_slug
    LIMIT 1;

    IF dep_component_id IS NOT NULL THEN
      -- Insert direct dependency (depth 1, is_demo_dependency=false)
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      VALUES (p_component_id, dep_component_id, 1, FALSE)
      ON CONFLICT DO NOTHING;

      -- Insert indirect dependencies from the dependency's closure table
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      SELECT p_component_id, cd.dependency_component_id, cd.depth + 1, FALSE
      FROM component_dependencies_closure cd
      WHERE cd.component_id = dep_component_id
      ON CONFLICT DO NOTHING;
    ELSE
      RAISE NOTICE 'Dependency not found for %/%', dep_username, dep_slug;
    END IF;
  END LOOP;

  -- Process demo direct dependencies
  FOREACH dep IN ARRAY demo_direct_deps
  LOOP
    -- Split 'username/slug' into 'dep_username' and 'dep_slug'
    dep_username := split_part(dep, '/', 1);
    dep_slug := split_part(dep, '/', 2);

    -- Find the component ID of the dependency
    SELECT c.id INTO dep_component_id
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE u.username = dep_username 
      AND c.component_slug = dep_slug
    LIMIT 1;

    IF dep_component_id IS NOT NULL THEN
      -- Insert direct demo dependency (depth 1, is_demo_dependency=true)
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      VALUES (p_component_id, dep_component_id, 1, TRUE)
      ON CONFLICT DO NOTHING;

      -- Insert indirect dependencies from the dependency's closure table
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      SELECT p_component_id, cd.dependency_component_id, cd.depth + 1, TRUE
      FROM component_dependencies_closure cd
      WHERE cd.component_id = dep_component_id 
        AND cd.is_demo_dependency = TRUE
      ON CONFLICT DO NOTHING;
    ELSE
      RAISE NOTICE 'Demo Dependency not found for %/%', dep_username, dep_slug;
    END IF;
  END LOOP;
END;$$;


ALTER FUNCTION "public"."update_component_dependencies_closure"("p_component_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_fts_after_tag_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    UPDATE components SET fts = NULL WHERE id = NEW.component_id;
    RETURN NULL;
END;$$;


ALTER FUNCTION "public"."update_component_fts_after_tag_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_with_tags"("p_component_id" integer, "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_license" "text" DEFAULT NULL::"text", "p_preview_url" "text" DEFAULT NULL::"text", "p_tags" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$

BEGIN
  UPDATE components
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    license = COALESCE(p_license, license),
    preview_url = COALESCE(p_preview_url, preview_url)
  WHERE id = p_component_id;

  IF p_tags IS NOT NULL THEN
    DELETE FROM component_tags
    WHERE component_id = p_component_id;

    DECLARE
      tag_record jsonb;
      tag_slug text;
      tag_id integer;
    BEGIN
      FOR tag_record IN SELECT * FROM jsonb_array_elements(p_tags) LOOP
        tag_slug := tag_record->>'slug';

        SELECT id INTO tag_id FROM tags WHERE slug = tag_slug;

        IF NOT FOUND THEN
          INSERT INTO tags (name, slug)
          VALUES (tag_record->>'name', tag_slug)
          RETURNING id INTO tag_id;
        END IF;

        INSERT INTO component_tags (component_id, tag_id)
        VALUES (p_component_id, tag_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_component_with_tags"("p_component_id" integer, "p_name" "text", "p_description" "text", "p_license" "text", "p_preview_url" "text", "p_tags" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    tags_text TEXT;
BEGIN

    SELECT STRING_AGG(t.name, ' ') INTO tags_text
    FROM component_tags ct
    JOIN tags t ON ct.tag_id = t.id
    WHERE ct.component_id = NEW.id;

    NEW.fts := 
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.component_slug, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(
            translate(NEW.component_names::text, '[]",', '    '), ''
        )), 'C') ||
        setweight(to_tsvector('english', coalesce(tags_text, '')), 'D');

    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_fts"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "backup"."component_dependencies_closure" (
    "component_id" bigint,
    "dependency_component_id" bigint,
    "depth" integer,
    "is_demo_dependency" boolean
);


ALTER TABLE "backup"."component_dependencies_closure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup"."component_likes" (
    "user_id" "text",
    "component_id" bigint,
    "liked_at" timestamp without time zone
);


ALTER TABLE "backup"."component_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup"."component_tags" (
    "component_id" bigint,
    "tag_id" bigint
);


ALTER TABLE "backup"."component_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup"."components" (
    "id" bigint,
    "component_names" "jsonb",
    "description" "text",
    "code" "text",
    "demo_code" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "user_id" "text",
    "dependencies" "jsonb",
    "is_public" boolean,
    "downloads_count" integer,
    "likes_count" integer,
    "component_slug" "text",
    "name" "text",
    "demo_dependencies" "jsonb",
    "preview_url" "text",
    "license" "text",
    "direct_registry_dependencies" "jsonb",
    "registry" "text",
    "fts" "tsvector",
    "demo_direct_registry_dependencies" "jsonb"
);


ALTER TABLE "backup"."components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup"."tags" (
    "id" bigint,
    "name" "text",
    "slug" "text"
);


ALTER TABLE "backup"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup"."users" (
    "id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "image_url" "text",
    "username" "text",
    "name" "text",
    "email" "text",
    "manually_added" boolean
);


ALTER TABLE "backup"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."component_dependencies_closure" (
    "component_id" bigint NOT NULL,
    "dependency_component_id" bigint NOT NULL,
    "depth" integer NOT NULL,
    "is_demo_dependency" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."component_dependencies_closure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."components" (
    "id" bigint NOT NULL,
    "component_names" "jsonb" NOT NULL,
    "description" "text",
    "code" "text" DEFAULT 'N/A'::"text" NOT NULL,
    "demo_code" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "dependencies" "jsonb",
    "is_public" boolean DEFAULT true NOT NULL,
    "downloads_count" integer DEFAULT 0 NOT NULL,
    "likes_count" integer DEFAULT 0 NOT NULL,
    "component_slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "demo_dependencies" "jsonb",
    "preview_url" "text" NOT NULL,
    "license" "text" DEFAULT 'mit'::"text" NOT NULL,
    "direct_registry_dependencies" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "registry" "text" DEFAULT 'ui'::"text" NOT NULL,
    "fts" "tsvector",
    "demo_direct_registry_dependencies" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "username" "text" NOT NULL,
    "name" "text",
    "email" "text" DEFAULT ''::"text",
    "manually_added" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."component_dependencies_graph_view" AS
 SELECT "cdc"."component_id",
    "cdc"."depth",
    "cdc"."is_demo_dependency",
    "cdc"."dependency_component_id",
    "sc"."component_slug" AS "source_component_slug",
    "su"."username" AS "source_author_username",
    "du"."username" AS "dependency_author_username",
    "dc"."id",
    "dc"."component_names",
    "dc"."description",
    "dc"."code",
    "dc"."demo_code",
    "dc"."created_at",
    "dc"."updated_at",
    "dc"."user_id",
    "dc"."dependencies",
    "dc"."is_public",
    "dc"."downloads_count",
    "dc"."likes_count",
    "dc"."component_slug",
    "dc"."name",
    "dc"."demo_dependencies",
    "dc"."preview_url",
    "dc"."license",
    "dc"."fts",
    "dc"."direct_registry_dependencies",
    "dc"."registry",
    "dc"."demo_direct_registry_dependencies"
   FROM (((("public"."component_dependencies_closure" "cdc"
     JOIN "public"."components" "sc" ON (("cdc"."component_id" = "sc"."id")))
     JOIN "public"."users" "su" ON (("sc"."user_id" = "su"."id")))
     JOIN "public"."components" "dc" ON (("cdc"."dependency_component_id" = "dc"."id")))
     JOIN "public"."users" "du" ON (("dc"."user_id" = "du"."id")));


ALTER TABLE "public"."component_dependencies_graph_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."component_likes" (
    "user_id" "text" NOT NULL,
    "component_id" bigint NOT NULL,
    "liked_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."component_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."component_tags" (
    "component_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."component_tags" OWNER TO "postgres";


ALTER TABLE "public"."component_tags" ALTER COLUMN "component_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."component_tags_component_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."components" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."components_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."components_with_username" AS
 SELECT "components"."id",
    "components"."component_names",
    "components"."description",
    "components"."code",
    "components"."demo_code",
    "components"."created_at",
    "components"."updated_at",
    "components"."user_id",
    "components"."dependencies",
    "components"."is_public",
    "components"."downloads_count",
    "components"."likes_count",
    "components"."component_slug",
    "components"."name",
    "components"."demo_dependencies",
    "components"."preview_url",
    "components"."license",
    "components"."fts",
    "components"."direct_registry_dependencies",
    "components"."registry",
    "components"."demo_direct_registry_dependencies",
    "users"."username",
    "to_jsonb"("users".*) AS "user"
   FROM ("public"."components"
     JOIN "public"."users" ON (("components"."user_id" = "users"."id")));


ALTER TABLE "public"."components_with_username" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE "public"."tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."component_dependencies_closure"
    ADD CONSTRAINT "component_dependencies_closure_pkey" PRIMARY KEY ("component_id", "dependency_component_id");



ALTER TABLE ONLY "public"."component_likes"
    ADD CONSTRAINT "component_likes_pkey" PRIMARY KEY ("user_id", "component_id");



ALTER TABLE ONLY "public"."component_tags"
    ADD CONSTRAINT "component_tags_pkey" PRIMARY KEY ("component_id", "tag_id");



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "components_fts_idx" ON "public"."components" USING "gin" ("fts");



CREATE UNIQUE INDEX "components_user_slug_key" ON "public"."components" USING "btree" ("user_id", "component_slug");



CREATE INDEX "idx_component_dependencies_closure_component_id" ON "public"."component_dependencies_closure" USING "btree" ("component_id");



CREATE INDEX "idx_components_component_slug" ON "public"."components" USING "btree" ("component_slug");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING "btree" ("email");



CREATE UNIQUE INDEX "users_username_key" ON "public"."users" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "component_tags_after_delete" AFTER DELETE ON "public"."component_tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_component_fts_after_tag_change"();



CREATE OR REPLACE TRIGGER "component_tags_after_insert" AFTER INSERT ON "public"."component_tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_component_fts_after_tag_change"();



CREATE OR REPLACE TRIGGER "components_dependencies_trigger" AFTER INSERT OR UPDATE ON "public"."components" FOR EACH ROW EXECUTE FUNCTION "public"."components_dependencies_trigger"();



CREATE OR REPLACE TRIGGER "components_fts_trigger" BEFORE INSERT OR UPDATE ON "public"."components" FOR EACH ROW EXECUTE FUNCTION "public"."update_fts"();



CREATE OR REPLACE TRIGGER "decrement_likes_count_trigger" AFTER DELETE ON "public"."component_likes" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_likes_count"();



CREATE OR REPLACE TRIGGER "increment_likes_count_trigger" AFTER INSERT ON "public"."component_likes" FOR EACH ROW EXECUTE FUNCTION "public"."increment_likes_count"();



CREATE OR REPLACE TRIGGER "update_fts_trigger" BEFORE INSERT OR UPDATE ON "public"."components" FOR EACH ROW EXECUTE FUNCTION "public"."update_fts"();



ALTER TABLE ONLY "public"."component_dependencies_closure"
    ADD CONSTRAINT "component_dependencies_closure_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_dependencies_closure"
    ADD CONSTRAINT "component_dependencies_closure_dependency_component_id_fkey" FOREIGN KEY ("dependency_component_id") REFERENCES "public"."components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_likes"
    ADD CONSTRAINT "component_likes_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_likes"
    ADD CONSTRAINT "component_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_tags"
    ADD CONSTRAINT "component_tags_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."component_tags"
    ADD CONSTRAINT "component_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Allow 'authenticated' to SELECT" ON "public"."component_dependencies_closure" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert component_tags" ON "public"."component_tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow everything to service role and supabase_admin" ON "public"."component_dependencies_closure" TO "dashboard_user", "service_role", "supabase_admin", "supabase_auth_admin", "supabase_storage_admin", "supabase_replication_admin", "supabase_realtime_admin", "postgres" USING (true) WITH CHECK (true);



CREATE POLICY "Allow individual update" ON "public"."users" FOR UPDATE USING (("public"."requesting_user_id"() = "id"));



CREATE POLICY "Allow liking components" ON "public"."component_likes" FOR INSERT WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Allow public read access" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Allow public select on component_tags" ON "public"."component_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public select on tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Allow read fts" ON "public"."components" FOR SELECT USING (true);



CREATE POLICY "Allow reading likes" ON "public"."component_likes" FOR SELECT USING (true);



CREATE POLICY "Allow unliking components" ON "public"."component_likes" FOR DELETE USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Allow updating likes_count" ON "public"."components" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Only authorized users can upload components" ON "public"."components" FOR INSERT WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Users can only update their own components" ON "public"."components" FOR UPDATE USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Users can see all components" ON "public"."components" FOR SELECT USING (true);



ALTER TABLE "public"."component_dependencies_closure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."component_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."component_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trigger_policy" ON "public"."component_dependencies_closure" USING ("public"."is_trigger_operation"()) WITH CHECK ("public"."is_trigger_operation"());



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."components";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."components_dependencies_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."components_dependencies_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."components_dependencies_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_component"("component_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_component"("component_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_component"("component_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_component_by_slug"("user_username" "text", "component_slug_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_component_by_slug"("user_username" "text", "component_slug_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_component_by_slug"("user_username" "text", "component_slug_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_trigger_operation"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_trigger_operation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trigger_operation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_components"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_components"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_components"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_dependencies_closure"("p_component_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_fts_after_tag_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_fts_after_tag_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_fts_after_tag_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_with_tags"("p_component_id" integer, "p_name" "text", "p_description" "text", "p_license" "text", "p_preview_url" "text", "p_tags" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_with_tags"("p_component_id" integer, "p_name" "text", "p_description" "text", "p_license" "text", "p_preview_url" "text", "p_tags" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_with_tags"("p_component_id" integer, "p_name" "text", "p_description" "text", "p_license" "text", "p_preview_url" "text", "p_tags" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_fts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_fts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_fts"() TO "service_role";


















GRANT ALL ON TABLE "public"."component_dependencies_closure" TO "anon";
GRANT ALL ON TABLE "public"."component_dependencies_closure" TO "authenticated";
GRANT ALL ON TABLE "public"."component_dependencies_closure" TO "service_role";



GRANT ALL ON TABLE "public"."components" TO "anon";
GRANT ALL ON TABLE "public"."components" TO "authenticated";
GRANT ALL ON TABLE "public"."components" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."component_dependencies_graph_view" TO "anon";
GRANT ALL ON TABLE "public"."component_dependencies_graph_view" TO "authenticated";
GRANT ALL ON TABLE "public"."component_dependencies_graph_view" TO "service_role";



GRANT ALL ON TABLE "public"."component_likes" TO "anon";
GRANT ALL ON TABLE "public"."component_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."component_likes" TO "service_role";



GRANT ALL ON TABLE "public"."component_tags" TO "anon";
GRANT ALL ON TABLE "public"."component_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."component_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."component_tags_component_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."component_tags_component_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."component_tags_component_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."components_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."components_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."components_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."components_with_username" TO "anon";
GRANT ALL ON TABLE "public"."components_with_username" TO "authenticated";
GRANT ALL ON TABLE "public"."components_with_username" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;


CREATE OR REPLACE FUNCTION "public"."get_filtered_components"(
  p_quick_filter text,
  p_sort_by text,
  p_offset integer,
  p_limit integer
) RETURNS TABLE (
  id integer,
  component_names jsonb,
  description text,
  code text,
  demo_code text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id text,
  dependencies jsonb,
  is_public boolean,
  downloads_count integer,
  likes_count integer,
  component_slug text,
  name text,
  demo_dependencies jsonb,
  registry text,
  direct_registry_dependencies jsonb,
  demo_direct_registry_dependencies jsonb,
  preview_url text,
  license text,
  user_data jsonb,
  total_count bigint
) LANGUAGE plpgsql AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Calculate total count based on filter
  WITH filtered_components AS (
    SELECT c.*
    FROM components c
    WHERE c.is_public = true
    AND CASE 
      WHEN p_quick_filter = 'last_released' THEN
        c.created_at > NOW() - INTERVAL '7 days'
      WHEN p_quick_filter = 'most_downloaded' THEN
        c.downloads_count > 6
      ELSE true
    END
  )
  SELECT COUNT(*) INTO v_total_count FROM filtered_components;

  RETURN QUERY
  WITH filtered_components AS (
    SELECT 
      c.*,
      row_to_json(u.*) as user_data
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE c.is_public = true
    AND CASE 
      WHEN p_quick_filter = 'last_released' THEN
        c.created_at > NOW() - INTERVAL '7 days'
      WHEN p_quick_filter = 'most_downloaded' THEN
        c.downloads_count > 6
      ELSE true
    END
  )
  SELECT 
    c.id,
    c.component_names,
    c.description,
    c.code,
    c.demo_code,
    c.created_at,
    c.updated_at,
    c.user_id,
    c.dependencies,
    c.is_public,
    c.downloads_count,
    c.likes_count,
    c.component_slug,
    c.name,
    c.demo_dependencies,
    c.registry,
    c.direct_registry_dependencies,
    c.demo_direct_registry_dependencies,
    c.preview_url,
    c.license,
    c.user_data,
    v_total_count as total_count
  FROM filtered_components c
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'downloads' THEN c.downloads_count
      WHEN p_sort_by = 'likes' THEN c.likes_count
      WHEN p_sort_by = 'date' THEN extract(epoch from c.created_at)
    END DESC NULLS LAST
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;
