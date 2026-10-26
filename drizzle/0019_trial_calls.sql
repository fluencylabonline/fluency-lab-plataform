-- Aula experimental (/trial-class): salas criadas pelo admin e pedidos de entrada de visitantes.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0018_media_title.sql.
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0019_trial_calls.sql
DO $$ BEGIN
  CREATE TYPE "trial_room_status" AS ENUM ('active', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "trial_request_status" AS ENUM ('pending', 'approved', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trial_rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(16) NOT NULL UNIQUE,
  "host_id" varchar(128) NOT NULL REFERENCES "users"("id"),
  "stream_call_id" varchar(255) NOT NULL UNIQUE,
  "status" "trial_room_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trial_join_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL REFERENCES "trial_rooms"("id") ON DELETE CASCADE,
  "guest_id" varchar(64) NOT NULL,
  "name" varchar(60) NOT NULL,
  "status" "trial_request_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_join_requests_room_idx" ON "trial_join_requests" ("room_id", "status");
