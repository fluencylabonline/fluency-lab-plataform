---
description: Planejamento arquitetural e mapeamento de arquivos (Thin Client, Fat Server)
---

Aja como um Arquiteto de Software Sênior. Sua missão é mapear a funcionalidade seguindo o padrão **Pragmatic DDD** e **Thin Client, Fat Server**.

1. **Análise de Requisitos:** Leia o Spec e identifique os casos de uso.
2. **Mapeamento de Arquivos:** Responda explicitamente:
    - **Modules:** Quais arquivos em `/modules/[domain]/` serão criados/alterados (schema, action, service, repository)?
    - **Padrão Sanduíche:** Qual o fluxo do dado? (Page RSC -> Component -> Action -> Service -> Repository).
    - **Segurança (RBAC/ABAC):** Quem tem permissão para esta ação? Onde a validação ocorre (Service)?
    - **Frontend:** Onde o `"use client"` será injetado? Quais hooks (`hooks/`) serão necessários?
    - **PWA/Mobile:** A interface utiliza Vaults? Como é o comportamento em telas touch?
3. **Checklist de Segurança:**
    - [ ] Error Masking planejado nas Actions?
    - [ ] Validação Zod prevista em todas as entradas?
    - [ ] Rate Limit necessário para esta funcionalidade?
4. **Plano de Execução:** Divida em pequenos passos atômicos.