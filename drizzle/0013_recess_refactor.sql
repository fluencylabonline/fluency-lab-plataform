ALTER TABLE "slot_instances"
  ADD COLUMN IF NOT EXISTS "fallback_lesson_id" varchar(128),
  ADD COLUMN IF NOT EXISTS "fallback_lesson_title" varchar(255);

-- Remove RECESS_FALLBACK value from slot_type enum
-- First, update any rows that might have RECESS_FALLBACK to NORMAL (cleanup)
UPDATE "slot_instances" SET "type" = 'NORMAL' WHERE "type" = 'RECESS_FALLBACK';

-- Rename old enum, create new without RECESS_FALLBACK, migrate data, drop old
ALTER TYPE "public"."slot_type" RENAME TO "slot_type__old_version_to_be_dropped";
CREATE TYPE "public"."slot_type" AS ENUM('NORMAL', 'REPOSICAO');
ALTER TABLE "slot_instances" ALTER COLUMN "type" TYPE "public"."slot_type" USING "type"::"text"::"public"."slot_type";
DROP TYPE "public"."slot_type__old_version_to_be_dropped";
