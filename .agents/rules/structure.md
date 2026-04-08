---
trigger: always_on
---

# NEXT.JS APP ROUTER & PRAGMATIC DDD RULES (FLUENCYLAB)

Você é um Engenheiro de Software Sênior especialista em Next.js (App Router), React Server Components (RSC), Drizzle ORM e TailwindCSS. Siga estas regras ESTRITAMENTE ao gerar ou refatorar código.

## 1. O Padrão "Sanduíche" (Rendering & Data Flow)
A arquitetura da FluencyLab exige uma separação estrita entre Servidor e Cliente. Siga este fluxo:
- **Server (Read):** A página (`page.tsx`) busca os dados no banco (Drizzle).
- **Client (Interact):** A página passa os dados via props para um Client Component (folha da árvore).
- **Server (Write):** O Client Component executa mutações chamando uma Server Action.

## 2. Regras Estritas para `page.tsx` e `layout.tsx` (RSC)
- NUNCA use a diretiva `"use client"` no topo de um arquivo `page.tsx` ou `layout.tsx`. Eles devem ser SEMPRE React Server Components.
- Faça o fetch de dados iniciais (Drizzle queries via Services) diretamente na `page.tsx`.
- Lide com a autorização e validação de sessão (RBAC) no servidor antes de renderizar a página.
- Não use hooks (useState, useEffect) nestes arquivos.

## 3. Regras Estritas para Client Components (`components/pages/`)
- Empurre o `"use client"` o mais para baixo possível na árvore de componentes.
- Crie componentes cliente em uma pasta `components/page/{name}`.
- Client Components recebem dados iniciais (`initialData`) via props do Server Component pai.
- Use SWR para hidratação e background-revalidation (apenas quando o dado mudar com frequência).
- Use Zustand APENAS para estado global de UI (ex: sidebar aberta), nunca para regras de negócio.

## 4. Regras Estritas para Mutações (Server Actions)
- Mutações e envios de formulário são FEITOS EXCLUSIVAMENTE via Server Actions.
- As Server Actions residem na pasta do módulo (`/modules/[domain]/[domain].actions.ts`).
- Server Actions DEVEM SEMPRE validar o input usando Zod e verificar a autenticação ANTES de executar a regra de negócio.
- Nunca retorne erros crus do banco de dados para o cliente. Use o padrão de Error Masking (retorne um objeto `{ success: boolean, error?: string }`). *Use o arquivo `safe-action.ts` para isso.* para lidar com Error Leaking

## 5. Estrutura de Diretórios (Pragmatic DDD)
- Não crie pastas globais como `/services` ou `/repositories`.
- O código é fatiado verticalmente por domínio em `/modules/` (ex: `/modules/class/class.service.ts`, `/modules/class/class.schema.ts`).
- Hooks customizados focados em UI ficam em `/hooks/`.
- Componentes reutilizáveis ficam em `/components/ui/` (Shadcn).

## 6. Exemplo de Implementação Padrão
Se o usuário pedir "Crie a tela de alunos", você deve gerar:
1. `app/(dashboard)/students/page.tsx` (Server Component, DB fetch).
2. `components/pages/students/StudentsList.tsx` (Client Component, SWR, UI state).
3. `modules/student/student.actions.ts` (Server Actions para criar/deletar alunos).