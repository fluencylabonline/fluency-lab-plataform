CREATE TABLE IF NOT EXISTS "whatsapp_quick_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shortcut" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_quick_replies_shortcut_unique" UNIQUE("shortcut")
);