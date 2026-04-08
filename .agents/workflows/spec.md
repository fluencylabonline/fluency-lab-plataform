---
description: Criação de especificações detalhadas para módulos (DDD + Security)
---

Aja como um Engenheiro de Dados e Arquiteto de Software. Crie o arquivo `spec-[nome-do-modulo].md` seguindo o **Spec-Driven Development**. O Spec deve conter:

1. **Drizzle Schema:** Definição precisa de tabelas, tipos e relações (`.schema.ts`).
2. **Zod Validation:** Schemas de validação gerados via `drizzle-zod`.
3. **Service Layer:** Assinatura e lógica principal do `.service.ts`, incluindo checagem **ESTRITA** de RBAC/ABAC (quem pode fazer o quê).
4. **Server Action:** Assinatura da `.actions.ts` com validação de entrada e Error Masking.
5. **Integração (se aplicável):** Webhooks ou APIs externas (Resend, AbacatePay).
6. **PWA/Offline:** Estratégia de cache e persistência (IndexedDB).

**Regra:** Não escreva código de Frontend (React) nesta fase. Pare e aguarde aprovação do Spec.

