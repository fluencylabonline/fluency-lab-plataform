ALTER TABLE "installments" ADD COLUMN "notified_2d_at" timestamp;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "notified_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "notified_overdue_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cellphone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tax_id" text;