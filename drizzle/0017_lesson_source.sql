-- Origem das lições migradas das apostilas antigas.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0016_holiday_recess.sql.
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0017_lesson_source.sql
--
-- Só colunas novas, nulas por padrão; nenhum dado existente é alterado.
-- source_workbook: nome da apostila ("First Steps", "The Basics"...).
-- source_position: posição pedagógica da lição dentro da apostila (1 = primeira).
ALTER TABLE "curriculum_lessons" ADD COLUMN IF NOT EXISTS "source_workbook" varchar(100);
--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN IF NOT EXISTS "source_position" integer;
