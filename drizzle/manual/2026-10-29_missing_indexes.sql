-- Índices declarados nos *.schema.ts (commit 523ee50, "perf: ondas 1 a 3") que nunca
-- foram criados em produção. Sem eles, slot_instances, installments, notifications etc.
-- fazem seq scan (slot_instances: ~800 mil seq scans, 1 bilhão de linhas lidas).
--
-- Este arquivo NÃO faz parte do journal do drizzle: CREATE INDEX CONCURRENTLY não roda
-- dentro de transação, e o drizzle-kit migrate envolve cada migração numa transação.
-- Execute instrução por instrução (fora de BEGIN/COMMIT), por exemplo:
--   psql "$DATABASE_URL" -f drizzle/manual/2026-10-29_missing_indexes.sql
-- CONCURRENTLY não bloqueia escritas. IF NOT EXISTS torna o arquivo idempotente.
-- Se uma instrução falhar no meio, o índice pode ficar INVALID: rode
--   DROP INDEX CONCURRENTLY <nome>;
-- e execute a instrução de novo.

-- scheduling
CREATE INDEX CONCURRENTLY IF NOT EXISTS "slot_instances_teacher_start_idx" ON "slot_instances" ("teacher_id", "start_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "slot_instances_student_start_idx" ON "slot_instances" ("student_id", "start_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "slot_instances_rule_start_idx" ON "slot_instances" ("rule_id", "start_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "slot_instances_status_start_idx" ON "slot_instances" ("status", "start_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "recess_requests_teacher_idx" ON "scheduling_recess_requests" ("teacher_id");

-- billing
CREATE INDEX CONCURRENTLY IF NOT EXISTS "subscriptions_student_status_idx" ON "subscriptions" ("student_id", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "installments_subscription_order_idx" ON "installments" ("subscription_id", "order_index");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "installments_status_due_idx" ON "installments" ("status", "due_date");

-- contract
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contract_instances_user_idx" ON "contract_instances" ("user_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contract_instances_subscription_idx" ON "contract_instances" ("subscription_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contract_instances_status_expires_idx" ON "contract_instances" ("status", "expires_at");

-- notification
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_user_created_idx" ON "notifications" ("user_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");

-- learning / notebook / course
CREATE INDEX CONCURRENTLY IF NOT EXISTS "student_item_progress_student_item_idx" ON "learning_student_item_progress" ("student_id", "item_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "student_item_progress_student_review_idx" ON "learning_student_item_progress" ("student_id", "next_review_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notebooks_student_teacher_created_idx" ON "notebooks" ("student_id", "teacher_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "course_quiz_submissions_user_quiz_idx" ON "course_quiz_submissions" ("user_id", "quiz_id", "created_at");

-- finance / communication
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_date_idx" ON "transactions" ("date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "whatsapp_conversations_last_message_idx" ON "whatsapp_conversations" ("last_message_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "whatsapp_messages_conversation_created_idx" ON "whatsapp_messages" ("conversation_id", "created_at");
