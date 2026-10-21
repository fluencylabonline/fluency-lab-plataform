-- Aulas de recesso gravadas (recesso de fim de ano) e e-mails do período.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0015_delinquency_policy.sql
-- (o `drizzle-kit generate` segue bloqueado pelo drift dos snapshots).
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0016_holiday_recess.sql
--
-- Só colunas novas com valor padrão; nenhum dado existente é alterado.

-- Tipo do curso: "course" (curso normal) ou "holiday_recess" (pacote de aulas
-- gravadas do recesso). Todos os cursos existentes continuam como "course".
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'course' NOT NULL;
--> statement-breakpoint
-- Campanhas de e-mail do recesso já enviadas (ex.: "2026-dec-01"), para o cron
-- nunca reenviar a mesma campanha.
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "holiday_recess_emails_sent" jsonb DEFAULT '[]'::jsonb NOT NULL;
