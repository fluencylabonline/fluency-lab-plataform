CREATE TYPE "public"."transcription_status" AS ENUM('pending', 'available', 'failed');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_message_status" AS ENUM('sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."contract_region" AS ENUM('BR', 'US');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('pending', 'signed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('student', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."party_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."xp_transaction_type" AS ENUM('practice_completion', 'streak_bonus', 'replay_purchase', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."placement_question_type" AS ENUM('multiple_choice', 'unscramble', 'audio_comprehension', 'grammar', 'context', 'writing');--> statement-breakpoint
CREATE TYPE "public"."recurring_cycle" AS ENUM('daily', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
ALTER TYPE "public"."lesson_status" ADD VALUE 'transcribing' BEFORE 'analyzing';--> statement-breakpoint
ALTER TYPE "public"."plan_status" ADD VALUE 'draft' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."plan_status" ADD VALUE 'approved' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."slot_type" ADD VALUE 'RECESS_FALLBACK';--> statement-breakpoint
CREATE TABLE "audios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"transcription" text NOT NULL,
	"file_url" text NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"previous_amount" integer,
	"new_amount" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_call_id" varchar(255) NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"teacher_id" varchar(128) NOT NULL,
	"notebook_id" uuid,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"transcription" text,
	"transcription_status" "transcription_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "call_sessions_stream_call_id_unique" UNIQUE("stream_call_id")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text NOT NULL,
	"student_email" text NOT NULL,
	"course_language" text NOT NULL,
	"hours" integer NOT NULL,
	"level_code" text NOT NULL,
	"level_description" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"issued_by" text NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wa_id" text NOT NULL,
	"student_id" text,
	"contact_name" text,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"last_message_content" text,
	"last_message_at" timestamp,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_conversations_wa_id_unique" UNIQUE("wa_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"content" text,
	"type" text DEFAULT 'text' NOT NULL,
	"direction" "whatsapp_message_direction" NOT NULL,
	"status" "whatsapp_message_status" DEFAULT 'sent' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"parent_instance_id" uuid,
	"subscription_id" uuid,
	"guardian_id" text,
	"guardian_data" jsonb,
	"status" "contract_status" DEFAULT 'pending' NOT NULL,
	"signed_content" text,
	"integrity_hash" text,
	"signed_at" timestamp,
	"expires_at" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_signatures_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"browser" text,
	"os" text,
	"location" text,
	"fingerprint" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"version" text NOT NULL,
	"region" "contract_region" NOT NULL,
	"type" "contract_type" NOT NULL,
	"party_type" "party_type" DEFAULT 'individual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text NOT NULL,
	"tax_id" text NOT NULL,
	"address" jsonb NOT NULL,
	"representative_name" text NOT NULL,
	"representative_tax_id" text NOT NULL,
	"support_phone" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"progress" jsonb DEFAULT '{"lessons":{}}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollments_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"duration" text,
	"content_type" text DEFAULT 'text' NOT NULL,
	"content_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quiz_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_quiz_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"language" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"duration" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash" varchar(64) NOT NULL,
	"service_name" varchar(50) NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "ai_cache_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "fiscal_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"mei_exempt_percentage" integer DEFAULT 32 NOT NULL,
	"irpf_ranges" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fiscal_configs_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"method" text,
	"category" text,
	"deductible" boolean DEFAULT false NOT NULL,
	"status" "transaction_status" DEFAULT 'paid' NOT NULL,
	"attachment_url" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immersion_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"lang" varchar(10) NOT NULL,
	"word" varchar(255) NOT NULL,
	"success" boolean NOT NULL,
	"attempts" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immersion_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"lang" varchar(10) NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_engagement_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(255) NOT NULL,
	"plan_id" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"type" "xp_transaction_type" NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_student_profile_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"student_id" varchar(255),
	"responses" jsonb NOT NULL,
	"qualitative_notes" text,
	"status" varchar(50),
	"changed_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notebook_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notebook_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "notebook_assets_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
CREATE TABLE "notebook_quiz_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notebook_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notebook_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "notebooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" text NOT NULL,
	"amount" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"abacate_payout_id" varchar(255),
	"pix_key" varchar(255) NOT NULL,
	"pix_key_type" varchar(50) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"description" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "scheduling_recess_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar(128) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_validated" boolean DEFAULT true NOT NULL,
	"fallback_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignees" (
	"task_id" uuid NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"icon" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"name" text NOT NULL,
	"color" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status_id" uuid,
	"project_id" uuid,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_cycle" "recurring_cycle",
	"parent_task_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduling_audit_logs" ALTER COLUMN "previous_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "scheduling_audit_logs" ALTER COLUMN "new_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "slot_instances" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "slot_instances" ALTER COLUMN "status" SET DEFAULT 'available'::text;--> statement-breakpoint
DROP TYPE "public"."slot_status";--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('scheduled', 'completed', 'canceled-student', 'canceled-teacher', 'canceled-admin', 'canceled-credit', 'no-show', 'rescheduled', 'teacher-recess', 'overdue', 'available');--> statement-breakpoint
ALTER TABLE "scheduling_audit_logs" ALTER COLUMN "previous_status" SET DATA TYPE "public"."slot_status" USING "previous_status"::"public"."slot_status";--> statement-breakpoint
ALTER TABLE "scheduling_audit_logs" ALTER COLUMN "new_status" SET DATA TYPE "public"."slot_status" USING "new_status"::"public"."slot_status";--> statement-breakpoint
ALTER TABLE "slot_instances" ALTER COLUMN "status" SET DEFAULT 'available'::"public"."slot_status";--> statement-breakpoint
ALTER TABLE "slot_instances" ALTER COLUMN "status" SET DATA TYPE "public"."slot_status" USING "status"::"public"."slot_status";--> statement-breakpoint
ALTER TABLE "curriculum_media" ALTER COLUMN "url" SET DATA TYPE varchar(512);--> statement-breakpoint
ALTER TABLE "learning_plans" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_plans" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'learning_student_profiles'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "learning_student_profiles" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_lesson_learning_items" ADD CONSTRAINT "curriculum_lesson_learning_items_lesson_id_item_id_pk" PRIMARY KEY("lesson_id","item_id");--> statement-breakpoint
ALTER TABLE "learning_plan_lessons" ADD CONSTRAINT "learning_plan_lessons_plan_id_lesson_id_pk" PRIMARY KEY("plan_id","lesson_id");--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "classes_per_week" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "native_language_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "analysis_result_json" jsonb;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "quality_analysis_json" jsonb;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "is_recess_activity" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD COLUMN "teacher_id" varchar(128);--> statement-breakpoint
ALTER TABLE "curriculum_media" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "learning_plans" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_plans" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "learning_plans" ADD COLUMN "language_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_plan_lessons" ADD COLUMN "scheduled_date" timestamp;--> statement-breakpoint
ALTER TABLE "learning_plan_lessons" ADD COLUMN "completed_practice_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ADD COLUMN "responses" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ADD COLUMN "status" "profile_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_student_profiles" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD COLUMN "language_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "type" "placement_question_type" DEFAULT 'multiple_choice' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "language_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "status" "question_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "audio_script" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "learning_item_id" varchar(255);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "source_media_id" uuid;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "slot_instances" ADD COLUMN "teacher_hourly_rate" integer;--> statement-breakpoint
ALTER TABLE "slot_instances" ADD COLUMN "payout_id" uuid;--> statement-breakpoint
ALTER TABLE "slot_instances" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "student_credits" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_tax_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pix_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pix_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "assigned_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_due_day" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guardian_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guardian_tax_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guardian_relationship" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_practice_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "app_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_prefs" jsonb DEFAULT '{"streak":true,"roadmap":true,"classes":true,"marketing":false,"whatsapp":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "teacher_hourly_rate" integer DEFAULT 4200 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "accepted_terms_version" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "guardian_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "data_retention_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "anonymized_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_pending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_pix_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_pix_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_amount" integer;--> statement-breakpoint
ALTER TABLE "audios" ADD CONSTRAINT "audios_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_parent_instance_id_contract_instances_id_fk" FOREIGN KEY ("parent_instance_id") REFERENCES "public"."contract_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_guardian_id_users_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signatures_metadata" ADD CONSTRAINT "contract_signatures_metadata_instance_id_contract_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."contract_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quiz_submissions" ADD CONSTRAINT "course_quiz_submissions_quiz_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quiz_submissions" ADD CONSTRAINT "course_quiz_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD CONSTRAINT "course_quizzes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immersion_history" ADD CONSTRAINT "immersion_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immersion_progress" ADD CONSTRAINT "immersion_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_engagement_logs" ADD CONSTRAINT "learning_engagement_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_practice_sessions" ADD CONSTRAINT "learning_practice_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_practice_sessions" ADD CONSTRAINT "learning_practice_sessions_plan_id_learning_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."learning_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_xp_transactions" ADD CONSTRAINT "learning_xp_transactions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_student_profile_history" ADD CONSTRAINT "learning_student_profile_history_profile_id_learning_student_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."learning_student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_assets" ADD CONSTRAINT "notebook_assets_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_quiz_limits" ADD CONSTRAINT "notebook_quiz_limits_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_quiz_limits" ADD CONSTRAINT "notebook_quiz_limits_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_sessions" ADD CONSTRAINT "notebook_sessions_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_sessions" ADD CONSTRAINT "notebook_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_statuses" ADD CONSTRAINT "task_statuses_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_id_task_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."task_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_immersion_progress_user_game" ON "immersion_progress" USING btree ("user_id","game_id");--> statement-breakpoint
ALTER TABLE "curriculum_lessons" ADD CONSTRAINT "curriculum_lessons_native_language_id_curriculum_languages_id_fk" FOREIGN KEY ("native_language_id") REFERENCES "public"."curriculum_languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_language_id_curriculum_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."curriculum_languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_language_id_curriculum_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."curriculum_languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_learning_item_id_curriculum_learning_items_id_fk" FOREIGN KEY ("learning_item_id") REFERENCES "public"."curriculum_learning_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_source_media_id_curriculum_media_id_fk" FOREIGN KEY ("source_media_id") REFERENCES "public"."curriculum_media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rate_limit_service_identifier" ON "curriculum_rate_limits" USING btree ("service_name","identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_student_profiles_student_id" ON "learning_student_profiles" USING btree ("student_id") WHERE student_id IS NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" DROP COLUMN "abacate_pay_checkout_url";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";