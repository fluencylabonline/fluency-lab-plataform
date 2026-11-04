-- Motivo da desativação da conta (F12 da auditoria): a tela /suspended mostrava
-- "Sentiremos sua falta! Você se despediu…" para qualquer conta inativa, inclusive
-- suspensa pelo admin ou cancelada por inadimplência.
--
-- Valores: 'cancelled' (aluno/escola cancelou o contrato), 'delinquency' (cron de
-- inadimplência), 'admin' (desativação manual). NULL = ativa ou registro antigo
-- (a tela usa o texto neutro de suspensão).
--
-- Fora do journal do drizzle (o snapshot está divergente do schema; o generate
-- pede resolução interativa de colunas). Idempotente:
--   psql "$DATABASE_URL" -f drizzle/manual/2026-11-04_users_deactivation_reason.sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivation_reason" text;

-- Opcional: contas já inativas com cancelamento concluído viram 'cancelled'.
-- Revise antes de rodar; sem isso elas recebem o texto neutro de suspensão.
-- UPDATE "users" u SET "deactivation_reason" = 'cancelled'
--   WHERE u."is_active" = false AND u."deactivation_reason" IS NULL AND u."anonymized_at" IS NULL
--     AND EXISTS (SELECT 1 FROM "contract_instances" c WHERE c."user_id" = u."id" AND c."status" = 'cancelled');
