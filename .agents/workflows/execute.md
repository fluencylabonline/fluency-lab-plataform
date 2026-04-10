---
description: Execução de tarefa seguindo o padrão Sanduíche e Pragmatic DDD
---

Execute a tarefa seguindo as regras da **FluencyLab**. 

1. **Schema First:** Se houver mudança em banco, altere o `[domain].schema.ts` primeiro.
2. **Fat Server:** Implemente a lógica no `[domain].service.ts` e queries no `[domain].repository.ts`.
3. **Thin Client:** Mantenha os componentes em `components/page/[name]` simples. Use hooks para lógica de UI.
4. **Mobile & PWA:** Se estiver criando diálogos ou formulários, use **Vaults** (especialmente no PWA).
5. **Segurança:** Garanta que todas as Actions usem o `safe-action.ts` e que não haja vazamento de erros (`Error Masking`).
6. **Iteração:** Informe ao terminar cada "fatia" do sanduíche para validação.