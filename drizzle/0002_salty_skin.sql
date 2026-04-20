CREATE TYPE "public"."credit_type" AS ENUM('bonus', 'late-students', 'teacher-cancellation');--> statement-breakpoint
CREATE TYPE "public"."recurrence_freq" AS ENUM('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('scheduled', 'completed', 'canceled-student', 'canceled-teacher', 'canceled-teacher-makeup', 'canceled-admin', 'canceled-credit', 'no-show', 'rescheduled', 'teacher-vacation', 'overdue', 'available');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('NORMAL', 'REPOSICAO');--> statement-breakpoint
CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar(128) NOT NULL,
	"student_id" varchar(128),
	"type" "slot_type" NOT NULL,
	"frequency" "recurrence_freq" NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid,
	"teacher_id" varchar(128) NOT NULL,
	"student_id" varchar(128),
	"type" "slot_type" NOT NULL,
	"status" "slot_status" DEFAULT 'available' NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"plan_id" varchar(128),
	"plan_name" varchar(255),
	"lesson_id" varchar(128),
	"lesson_title" varchar(255),
	"rescheduled_from" jsonb,
	"converted_to_available_slot" boolean DEFAULT false,
	"converted_at" timestamp,
	"credit_id" uuid,
	"credit_type" "credit_type",
	"is_reschedulable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"type" "credit_type" NOT NULL,
	"amount" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"granted_by" varchar(128) NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	"used_for_class_id" uuid,
	"reason" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "slot_instances" ADD CONSTRAINT "slot_instances_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_instances" ADD CONSTRAINT "slot_instances_credit_id_student_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."student_credits"("id") ON DELETE no action ON UPDATE no action;