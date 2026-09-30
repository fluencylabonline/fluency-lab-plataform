-- Custom migration (drizzle-kit's interactive rename-detector needs a TTY
-- this environment doesn't have; hand-written instead of generated).
-- Adds two nullable timestamp columns, no data migration needed.
ALTER TABLE "installments" ADD COLUMN "payment_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_pix_expires_at" timestamp;
