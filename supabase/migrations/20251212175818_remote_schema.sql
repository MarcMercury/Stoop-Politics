


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."episodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "audio_url" "text" NOT NULL,
    "cover_image_url" "text",
    "duration_seconds" integer,
    "is_published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."episodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transcript_nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "episode_id" "uuid",
    "content" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "start_time" double precision,
    "end_time" double precision,
    "reference_link" "text",
    "reference_title" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transcript_nodes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."episodes"
    ADD CONSTRAINT "episodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transcript_nodes"
    ADD CONSTRAINT "transcript_nodes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_episodes_published" ON "public"."episodes" USING "btree" ("is_published", "published_at" DESC);



CREATE INDEX "idx_transcript_nodes_episode" ON "public"."transcript_nodes" USING "btree" ("episode_id", "display_order");



ALTER TABLE ONLY "public"."transcript_nodes"
    ADD CONSTRAINT "transcript_nodes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE CASCADE;



CREATE POLICY "Admin has full access to episodes" ON "public"."episodes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage episodes" ON "public"."episodes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage transcripts" ON "public"."transcript_nodes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public can view published episodes" ON "public"."episodes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view transcripts of published episodes" ON "public"."transcript_nodes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."episodes"
  WHERE (("episodes"."id" = "transcript_nodes"."episode_id") AND ("episodes"."is_published" = true)))));



ALTER TABLE "public"."episodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transcript_nodes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."episodes" TO "anon";
GRANT ALL ON TABLE "public"."episodes" TO "authenticated";
GRANT ALL ON TABLE "public"."episodes" TO "service_role";



GRANT ALL ON TABLE "public"."transcript_nodes" TO "anon";
GRANT ALL ON TABLE "public"."transcript_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."transcript_nodes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Public can view published episodes" on "public"."episodes";


  create policy "Public can view published episodes"
  on "public"."episodes"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Authenticated users can delete media"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'media'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Authenticated users can update media"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'media'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Authenticated users can upload media"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'media'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Public can view media"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'podcast-media'::text));



