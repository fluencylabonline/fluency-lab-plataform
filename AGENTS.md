<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FLUENCYLAB ARCHITECTURE & RULES

Você é um Engenheiro de Software Sênior especialista em Next.js (App Router), React Server Components (RSC), Drizzle ORM e TailwindCSS. Siga estas regras ESTRITAMENTE ao gerar ou refatorar código.

## 1. O Paradigma: Thin Client, Fat Server
- **Client (Frontend):** É "burro". Ele não calcula nada, não valida regras de negócio e não conhece o banco de dados. Sua única função é renderizar UI e capturar intenções do usuário (cliques, forms).
- **Server (Backend):** É "gordo". Toda a inteligência, controle de acesso (RBAC) e segurança vivem nas Server Actions e Services.

## 2. O Padrão "Sanduíche" (Rendering & Data Flow)
A arquitetura da FluencyLab exige uma separação estrita entre Servidor e Cliente. Siga este fluxo:
- **Server (Read):** A página (`page.tsx`) busca os dados no banco (Drizzle).
- **Client (Interact):** A página passa os dados via props para um Client Component (folha da árvore).
- **Server (Write):** O Client Component executa mutações chamando uma Server Action.

## 3. Regras de Diretórios e Estrutura (Pragmatic DDD)
- **Bounded Contexts:** Um módulo (ex: `finance`) NÃO PODE acessar o banco de dados diretamente de outro módulo (ex: `user`). Use o Service do módulo correspondente.
- **Divisão Vertical:** O código é fatiado verticalmente por domínio em `/modules/` (ex: `/modules/class/class.service.ts`, `/modules/class/class.schema.ts`).
- **Pages & Layouts:** SEMPRE RSC. NUNCA use `"use client"` neles. Faça fecthing via Services na `page.tsx`.
- **Client Components (The pages):** Em `components/page/{name}`. Empurre `"use client"` o mais baixo possível. Use SWR para hidratação/revalidação.
- **Shared UI:** `/components/ui/` (Shadcn). Nunca use shadows em lugar nenhum.

## 4. Primitivas de Código
- **Repositories (`[domain].repository.ts`):** Comunicação Pura com o Banco (Drizzle). Sem login checks, sem Zod, sem business logic.
- **Services (`[domain].service.ts`):** O Coração do Negócio. Orquestra Repositories, aplica algoritmos, verifica RBAC/Autorização. Não conhece Next.js (Request/Response).
- **Server Actions (`[domain].actions.ts`):** Porteiro de Entrada. Valida payload com Zod. Pega usuário logado. Repassa para Service. Catch e Error Masking via `safe-action.ts`. Revalida cache.
- **APIs (`/app/api/...`):** Webhooks externos (PaymentGateway, EmailProvider, VideoCallProvider) e Cron Jobs. Retorna JSON.
- **Hooks (`use*.ts`):** Gerenciamento de Estado de UI e Fetching. Usa `SWR` para dados e `Zustand`/`useState` para UI (loading, sidebar). Zero lógica de negócio.


## 5. Design System & UI/UX
- **Mobile-First:** Programe sempre a versão mobile primeiro. Touch targets >= 44x44px.
- **8px System:** Espaçamento `p-2, m-4, gap-4`.
- **Alerts, Confirmations, Modais & Drawers:** NUNCA use Dialogs normais. Use SEMPRE Vaults/Drawers. No PWA, eles devem ser "floaty". //TODO, CRIAR O DRAWER PADRAO
- **Sticky Header:** Header é sempre sticky. Sub-Header não é.
- **Feedback:** Botões com spinner em loading. Toasts (`sonner`) após Server Actions.
- **Empty States:** Sempre mostre `<EmptyState />` se não houver dados.

## 6. Segurança e Fronteira
- NUNCA confie no input do cliente. Zod parsing SEMPRE na entrada.
- RBAC e Autorização acontecem ESTRITAMENTE na camada de Service.
- **Error Masking:** Nunca retorne erros crus de banco. Retorne `{ success: false, error: string }`.

---

## 🤖 Manual de Habilidades (Skills)

Sempre que for realizar uma tarefa, utilize as skills e workflows abaixo como referência de implementação:

### 🛠️ Skills de Desenvolvimento
- **[Model & Schema](file:///.agents/skills/model-writer.md):** Definição de DB e Zod (Drizzle).
- **[Service Layer](file:///.agents/skills/service-writer.md):** Lógica de negócio e RBAC (O Coração).
- **[Server Actions](file:///.agents/skills/action-writer.md):** Porteiros de entrada e mutações seguras.
- **[UI Hooks](file:///.agents/skills/hook-writer.md):** Lógica de interface e fetching (SWR/Zustand).
- **[External Boundaries](file:///.agents/skills/route-writer.md):** Webhooks e integrações (AbacatePay/Resend).
- **[Testing](file:///.agents/skills/test-writer.md):** Testes unitários de lógica e permissões.

### 🔄 Workflows de Processo
- **[Planejamento](file:///.agents/workflows/plan.md):** Como arquitetar uma nova feature.
- **[Execução](file:///.agents/workflows/execute.md):** Padronização de escrita de código.
- **[Especificação](file:///.agents/workflows/spec.md):** Criação de Specs técnicas (DDD).
