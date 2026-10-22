-- Título da mídia (áudio) da biblioteca de mídia.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0017_lesson_source.sql.
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0018_media_title.sql
--
-- Antes a tela mostrava o começo do nome do arquivo no Storage ("curriculum" para todas as mídias de lição).
-- Coluna nova e nula por padrão; o preenchimento só atinge linhas ainda sem título.
ALTER TABLE "curriculum_media" ADD COLUMN IF NOT EXISTS "title" varchar(255);
--> statement-breakpoint
-- Mídias ligadas a uma lição passam a ter o título da lição.
UPDATE "curriculum_media" m
SET "title" = l."title"
FROM "curriculum_lessons" l
WHERE l."media_id" = m."id" AND m."title" IS NULL;
