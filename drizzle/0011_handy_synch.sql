ALTER TABLE "users" ADD COLUMN "pwa_installed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pwa_installed_at" timestamp;