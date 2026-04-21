ALTER TYPE "public"."lesson_status" ADD VALUE 'reviewing_quiz' BEFORE 'ready';--> statement-breakpoint
CREATE TABLE "curriculum_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(50) NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ALTER COLUMN "embedding" SET DATA TYPE vector(3072);--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ALTER COLUMN "student_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ALTER COLUMN "profile_vector" SET DATA TYPE vector(3072);--> statement-breakpoint
ALTER TABLE "curriculum_learning_items" ADD COLUMN "lemma" text NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_learning_items" ADD COLUMN "translation" text;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "language_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "quiz_data" jsonb;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "content_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD CONSTRAINT "curriculum_lessons_language_id_curriculum_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."curriculum_languages"("id") ON DELETE no action ON UPDATE no action;