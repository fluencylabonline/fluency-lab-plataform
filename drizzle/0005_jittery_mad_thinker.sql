CREATE TYPE "public"."skill_type" AS ENUM('grammar', 'vocabulary', 'reading', 'listening');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "placement_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"initial_elo_score" integer NOT NULL,
	"final_elo_score" integer,
	"status" "test_status" DEFAULT 'in_progress'
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"context" text,
	"options" jsonb NOT NULL,
	"correct_option_id" text NOT NULL,
	"skill" "skill_type" NOT NULL,
	"difficulty_level" integer NOT NULL,
	"cefr_level" text NOT NULL,
	"times_answered" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer,
	"question_id" integer,
	"selected_option_id" text,
	"is_correct" boolean NOT NULL,
	"elo_score_after_answer" integer NOT NULL,
	"answered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "learning_student_item_progress" ADD COLUMN "passed_contexts_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_placement_test_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_elo_score" integer DEFAULT 600 NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_test_id_placement_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."placement_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;