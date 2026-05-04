CREATE TABLE IF NOT EXISTS "notebooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);