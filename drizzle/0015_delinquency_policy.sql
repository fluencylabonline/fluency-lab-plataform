-- Política de inadimplência: lembretes repetidos, aviso final e bloqueio.
--
-- Escrita à mão e idempotente, no mesmo estilo de 0014_docs_questions.sql
-- (o `drizzle-kit generate` segue bloqueado pelo drift dos snapshots).
-- Aplicar com: npx tsx scripts/apply-migration.ts drizzle/0015_delinquency_policy.sql
--
-- Só colunas novas e anuláveis; nenhum dado existente é alterado.

-- Último lembrete de atraso enviado e quantos já foram (cadência de 3 em 3 dias).
ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "last_overdue_reminder_at" timestamp;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "overdue_reminder_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Aviso do último dia do mês do vencimento ("amanhã seu acesso será bloqueado").
ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "notified_final_warning_at" timestamp;--> statement-breakpoint
-- Aviso do último dia do mês de bloqueio ("amanhã sua conta será cancelada").
ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "notified_cancel_warning_at" timestamp;--> statement-breakpoint
-- Marca que o aluno chegou a ficar bloqueado por esta parcela; usado para
-- avisar o professor do desbloqueio quando ela for paga.
ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "blocked_at" timestamp;
