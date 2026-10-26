-- Aula experimental: anotações do professor, transcrição salva, perfil gerado e e-mail do visitante.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0019_trial_calls.sql.
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0020_trial_notes.sql
ALTER TABLE "trial_rooms" ADD COLUMN IF NOT EXISTS "notes" jsonb;
--> statement-breakpoint
ALTER TABLE "trial_rooms" ADD COLUMN IF NOT EXISTS "transcription" text;
--> statement-breakpoint
-- Reaproveita o enum da chamada normal (pending | available | failed).
ALTER TABLE "trial_rooms" ADD COLUMN IF NOT EXISTS "transcription_status" "transcription_status" DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "trial_rooms" ADD COLUMN IF NOT EXISTS "profile_id" uuid REFERENCES "learning_student_profiles"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "trial_rooms" ADD COLUMN IF NOT EXISTS "analyzed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "trial_join_requests" ADD COLUMN IF NOT EXISTS "email" varchar(255);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_join_requests_email_idx" ON "trial_join_requests" (lower("email"));
