---
description:
---

# Workflow: Ciclo Completo de Feature — Dev → Teste → Produção

> Use este guia sempre que for criar uma feature nova, do zero até o deploy em produção.

---

## 📋 PRÉ-REQUISITO (uma vez só)

Verifique que seu `.env.local` está apontando para o banco de **dev**:

---

## FASE 1 — Criar a feature localmente

### Passo 1.1 — Garanta que está na branch `dev` e atualizada

```bash
git checkout dev
git pull origin dev
```

### Passo 1.2 — Crie uma branch de feature a partir da dev

```bash
git checkout -b feature/nome-da-feature
```

> **Convenção de nomes:** `feature/`, `fix/`, `refactor/`, `chore/`  
> Ex: `feature/student-progress-chart`, `fix/elo-score-inflation`

### Passo 1.3 — Inicie o servidor local

```bash
npm run dev
```

O servidor roda em `http://localhost:3000` apontando para:

- 🟢 Banco Neon branch `dev`
- 🟢 Firebase projeto `fluency-lab-plataform` (dev)

### Passo 1.4 — Se a feature muda o schema do banco

Edite o arquivo `*.schema.ts` correspondente e depois:

```bash
# 1. Gera o arquivo SQL de migration na pasta ./drizzle/
npm run db:generate

# 2. Aplica no banco dev para testar localmente
npm run db:push
```

> **Nunca rode `db:push:prod` nesta fase.** O banco de produção só é atualizado na Fase 3.

---

## FASE 2 — Testar no Preview (Vercel)

### Passo 2.1 — Faça commit e push da feature para a branch `dev`

```bash
git add .
git commit -m "feat: descrição clara da mudança"

# Sobe para a branch dev no GitHub
git checkout dev
git merge feature/nome-da-feature
git push origin dev
```

### Passo 2.2 — A Vercel cria o Preview automaticamente

Após o push para `dev`, a Vercel detecta e faz um deploy de preview com:

- 🟢 Banco Neon branch `dev`
- 🟢 Firebase projeto `fluency-lab-plataform` (dev)

A URL do preview aparece no painel da Vercel ou no status do GitHub commit.  
Ex: `https://fluency-lab-plataform-git-dev-xxx.vercel.app`

### Passo 2.3 — Teste no Preview

Acesse a URL de preview e valide:

- [ ] A feature funciona como esperado?
- [ ] Não quebrou nenhuma outra tela?
- [ ] Dados do banco de dev estão corretos?

---

## FASE 3 — Merge para Produção

### Passo 3.1 — Abra um Pull Request no GitHub

```
dev → main
```

No GitHub: **Pull Requests → New Pull Request → base: main ← compare: dev**

Escreva uma descrição clara do que foi feito e se houve mudança de schema.

### Passo 3.2 — ⚠️ Se houve mudança de schema: aplique a migration em produção

**Faça isso ANTES ou LOGO APÓS o merge** (antes é mais seguro para evitar downtime):

```bash
# Certifique-se de que o .env.local ainda está no banco dev
# O script db:migrate:prod usa cross-env DB_ENV=production internamente
npm run db:migrate:prod
```

Isso aplica os arquivos da pasta `./drizzle/` no branch `production` do Neon.

> **Não houve mudança de schema?** Pule este passo.

### Passo 3.3 — Faça o Merge no GitHub

Clique em **"Merge pull request"** → **"Confirm merge"** no GitHub.

A Vercel detecta o merge na `main` e inicia o deploy de produção automaticamente com:

- 🔴 Banco Neon branch `production`
- 🔴 Firebase projeto `fluencylabplataform` (prod)

### Passo 3.4 — Verifique o deploy de produção

Acesse `https://fluencylab.me` (ou seu domínio) e confirme que a feature está funcionando.

---

## FASE 4 — Limpeza pós-deploy

### Passo 4.1 — Atualize a branch dev com as mudanças da main

```bash
git checkout dev
git pull origin main
git push origin dev
```

### Passo 4.2 — Delete a branch de feature

```bash
git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature
```

---

## 🗺️ Mapa Visual do Fluxo

```
feature/xyz
    │
    │  (desenvolvimento local)
    │  npm run dev → localhost:3000
    │  banco: Neon dev | firebase: dev
    │
    ▼
   dev  ──── push ──── Vercel Preview
    │         (testa na URL de preview)
    │
    │  git pull request: dev → main
    │  npm run db:migrate:prod  ← (se mudou schema)
    │
    ▼
  main  ──── merge ──── Vercel Produção
              (fluencylab.me)
              banco: Neon production | firebase: prod
```

---

## ⚡ Referência Rápida de Comandos

| Etapa                      | Comando                                    |
| -------------------------- | ------------------------------------------ |
| Entrar na branch dev       | `git checkout dev`                         |
| Criar branch de feature    | `git checkout -b feature/nome`             |
| Rodar local                | `npm run dev`                              |
| Gerar migration            | `npm run db:generate`                      |
| Aplicar no banco dev       | `npm run db:push`                          |
| Subir para GitHub          | `git push origin dev`                      |
| Aplicar migration em prod  | `npm run db:migrate:prod`                  |
| Sincronizar dev após merge | `git checkout dev && git pull origin main` |

---

## 🚨 Regras de Ouro

1. **Nunca commite direto na `main`.** Sempre passe pela `dev` com PR.
2. **Nunca rode `db:push:prod` ou `db:migrate:prod` sem ter testado no dev antes.**
3. **Sempre rode `db:migrate:prod` antes ou logo após o merge** se houver mudança de schema — nunca deixe para depois.
4. **O `.env.local` local SEMPRE aponta para o banco `dev`.** Só o Vercel (via env vars de produção) usa o banco `production`.
5. **Mexeu em página? Atualize a ajuda dela antes do PR.** Botão novo ou removido, opção de `Select` alterada, regra de negócio mudada ou página nova → `modules/page-help/content/` nos dois idiomas. Checklist completo em `.agents/rules/page-help.md`.
