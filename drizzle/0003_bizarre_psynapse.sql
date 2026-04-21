CREATE TYPE "public"."cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."learning_item_type" AS ENUM('VOCABULARY', 'STRUCTURE');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('draft', 'analyzing', 'processing_items', 'reviewing', 'ready', 'error');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending_review', 'approved');--> statement-breakpoint
CREATE TYPE "public"."item_priority" AS ENUM('CORE', 'SECONDARY');--> statement-breakpoint
CREATE TYPE "public"."student_item_status" AS ENUM('LOCKED', 'ACTIVE', 'RECEPTIVE', 'MASTERED');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TABLE "curriculum_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "curriculum_learning_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"language_id" uuid NOT NULL,
	"type" "learning_item_type" NOT NULL,
	"metadata" jsonb NOT NULL,
	"structure_chunks" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_lesson_learning_items" (
	"lesson_id" uuid NOT NULL,
	"item_id" varchar(255) NOT NULL,
	"priority" "item_priority" DEFAULT 'CORE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid,
	"title" varchar(255) NOT NULL,
	"difficulty" "cefr_level" NOT NULL,
	"content_text" text,
	"content_json" jsonb,
	"embedding" vector(768),
	"status" "lesson_status" DEFAULT 'draft' NOT NULL,
	"creation_step" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(255) NOT NULL,
	"transcription_text" text,
	"transcription_timestamps" jsonb,
	"status" "media_status" DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_plan_lessons" (
	"plan_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "learning_student_item_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"item_id" varchar(255) NOT NULL,
	"status" "student_item_status" DEFAULT 'LOCKED' NOT NULL,
	"contexts_passed" integer DEFAULT 0 NOT NULL,
	"structure_chunks_passed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"consecutive_correct" integer DEFAULT 0 NOT NULL,
	"next_review_date" timestamp DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_student_profiles" (
	"student_id" text PRIMARY KEY NOT NULL,
	"profile_vector" vector(768),
	"qualitative_notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduling_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"previous_status" "slot_status",
	"new_status" "slot_status" NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slot_instances" ADD COLUMN "reminder_24h_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "slot_instances" ADD COLUMN "reminder_1h_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_learning_items" ADD CONSTRAINT "curriculum_learning_items_language_id_curriculum_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."curriculum_languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lesson_learning_items" ADD CONSTRAINT "curriculum_lesson_learning_items_lesson_id_curriculum_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lesson_learning_items" ADD CONSTRAINT "curriculum_lesson_learning_items_item_id_curriculum_learning_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."curriculum_learning_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD CONSTRAINT "curriculum_lessons_media_id_curriculum_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."curriculum_media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_plans" ADD CONSTRAINT "learning_plans_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_plan_lessons" ADD CONSTRAINT "learning_plan_lessons_plan_id_learning_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."learning_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_plan_lessons" ADD CONSTRAINT "learning_plan_lessons_lesson_id_curriculum_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_student_item_progress" ADD CONSTRAINT "learning_student_item_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_student_item_progress" ADD CONSTRAINT "learning_student_item_progress_item_id_curriculum_learning_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."curriculum_learning_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ADD CONSTRAINT "learning_student_profiles_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;