# Regra: Ajuda de Página e Tour Guiado

> **Toda página de `/hub` explica a si mesma.** Se a tela muda, a explicação muda no mesmo PR.
> Ajuda errada é pior que ajuda nenhuma — ela faz o usuário confiar em algo que não existe mais.

---

## O que é a feature

Um botão **(?)** no header de toda página do hub (desktop e mobile) abre um painel que explica
a página em linguagem simples. Dentro do painel, o botão **"Me mostre"** escurece a tela e
percorre as partes importantes, uma por vez, com holofote.

| Peça | Arquivo | Papel |
|---|---|---|
| Registry | `modules/page-help/page-help.ts` | Junta o conteúdo e resolve `pathname` → entrada (inclusive rotas dinâmicas) |
| Tipos e união de rotas | `modules/page-help/page-help.types.ts` | `HelpRoute`, `PageHelp`, `TourStep` |
| Conteúdo | `modules/page-help/content/<papel>.<idioma>.ts` | O texto, em `pt` e `en` |
| Engine do tour | `components/ui/tour-overlay.tsx` | `<TourOverlay steps open onClose />` — única superfície |
| Painel automático | `modules/page-help/_components/PageHelpWizard.tsx` | Monta um `Wizard` a partir das `sections` do registry — um passo por seção |
| Cola | `modules/page-help/_components/PageHelpProvider.tsx` | Estado, `(?)`, filtro de `only`, registro de wizard |

O botão vive dentro de `components/layout/header.tsx`. **Nenhuma página monta o (?) à mão.**

---

## Checklist obrigatório

Rode este checklist sempre que mexer em qualquer coisa sob `app/[locale]/hub/`.

### 1. Página nova
- [ ] Adicionar a rota à união do papel em `page-help.types.ts` (`StudentHelpRoute`, `TeacherHelpRoute`, `ManagerHelpRoute`, `AdminHelpRoute` ou `SharedHelpRoute`).
- [ ] Escrever a entrada `PageHelp` em `content/<papel>.pt.ts` **e** `content/<papel>.en.ts`.
      O build falha sem as duas — é de propósito.
- [ ] Marcar com `data-tour` os elementos que o tour destaca.

### 2. Botão, filtro ou `Select` adicionado / removido / renomeado
- [ ] Conferir a entrada da rota nos dois idiomas: a seção que descreve controles ainda está certa?
- [ ] `Select` com opções novas ou removidas → atualizar a lista de opções na explicação.
      As opções **são** conteúdo de ajuda; usuário nenhum adivinha o que "Pró-rata" faz.
- [ ] Elemento com `data-tour` removido ou renomeado → atualizar ou remover o passo que aponta
      para ele. Passo órfão não quebra a tela (é ignorado, com aviso no console em dev), mas o
      tour fica com um buraco.

### 3. Regra de negócio visível mudou (prazo, crédito, política, status)
- [ ] Atualizar a explicação nos dois idiomas.
- [ ] Se a rota tem artigo em `modules/docs/docs.content.<papel>.ts`, atualizar **os dois** —
      eles contam a mesma história para o mesmo usuário.

### 4. Página removida
- [ ] Remover a rota da união e as entradas de `pt` e `en`.

---

## Como escrever o conteúdo

**Público:** alguém que nunca usou a plataforma. Segunda pessoa, direto com a pessoa
("Você recebe um convite por e-mail…"), no mesmo tom de `modules/docs/`.

**Antes de escrever, leia o código.** Nunca descreva comportamento por dedução:

1. O `page.tsx` e os `_components/` — todo botão, todo `Select` (e suas opções), todo filtro,
   toda coluna, todo status.
2. O artigo correspondente em `modules/docs/docs.content.<papel>.ts`, quando existir. Os blocos
   `actions` já documentam cada controle como *label / does / flow / warning*.
3. Não havendo artigo, confirmar a regra no `Service` do módulo. **Inventar fluxo é proibido.**

**Formato de cada entrada:**

| Campo | Regra |
|---|---|
| `title` | O nome da página, como o usuário a vê |
| `summary` | **Uma** frase: o que esta página é e para que serve |
| `sections` | O que a tela mostra, o que cada botão faz, e as regras que pegam as pessoas de surpresa. `body` como array vira lista de tópicos |
| `tour` | 4 a 7 passos. `id` estável e igual nos dois idiomas |
| `docsArticleId` | O `id` do artigo da Central de Ajuda, quando existir |

**Regras de escrita:**
- `pt` primeiro; `en` é tradução do mesmo texto, não um texto novo.
- Sem jargão interno. "Pró-rata" sempre vem com a explicação junto.
- Prazos, limites e penalidades em números ("até 15 minutos", "4 horas de antecedência"),
  nunca em vagueza ("com antecedência").
- Um passo de tour explica **um** elemento. Passo sem `target` = card centralizado, bom para
  abrir e fechar o tour.

---

## Convenções técnicas

**`data-tour`** — `"<escopo>.<elemento>"`. Escopo é a rota (`student-profile.next-class`) ou
`chrome` para o que é global e reusável:

| Marcador | Onde |
|---|---|
| `chrome.nav` | `components/layout/sidebar.tsx` (sidebar do desktop e barra inferior do mobile) |
| `chrome.help` | `modules/page-help/_components/PageHelpButton.tsx` |
| `chrome.theme` | `components/ui/theme-switcher.tsx` |
| `chrome.notifications` | `modules/notification/_components/NotificationBell.tsx` |
| `chrome.account` | `components/layout/user-menu.tsx` |

A engine procura o primeiro elemento **visível** com o marcador, então o mesmo valor pode
aparecer na versão mobile e na desktop de um componente.

**`only: "desktop" | "mobile"`** para controles que existem em só um dos layouts. O
`PageHelpProvider` filtra antes de passar os passos para a engine.

**Atenção:** a `Sidebar` não é renderizada em `/hub/student/practice/session` nem no player de
curso (`**/courses/[id]`). Não usar `chrome.nav` nos tours dessas páginas.

---

## Todo painel é um `Wizard`

Regularidade de propósito: o `(?)` sempre abre um `components/ui/wizard.tsx` — passo a passo,
com dots e setas — nunca um Vault de rolagem única. Duas origens de conteúdo convivem:

- **A maioria das páginas** não tem wizard próprio. O `PageHelpWizard` monta os passos a partir
  das `sections` do registry, um passo por seção, mais um passo de abertura com título e resumo.
  Nada aqui precisa ser escrito à mão — é reflexo direto do `PageHelp` da rota.
- **Nove páginas** já tinham um wizard que abre sozinho no primeiro acesso
  (`hooks/ui/use-wizard.ts`), com conteúdo próprio, rico o bastante para não caber no molde
  seção→passo. Elas **mantêm** esse wizard. A unificação foi:
  - O `(?)` local saiu do `headerActions` da página.
  - A página chama `useRegisterPageHelp(setIsHelpOpen)` — assim o `(?)` do header abre **o
    wizard dela**, não um segundo painel.
  - A entrada no registry dessas rotas ganha `panel: "wizard"` e só declara `tour`; `sections`
    fica proibido pelo tipo (`PageHelp` é uma união discriminada por `panel`) — o conteúdo do
    painel vive no componente do wizard, não no registry.

Nos dois casos o wizard recebe `extraFooter={<ShowMeAroundButton variant="outline" />}`, fixo em
todos os passos — é o "Me mostre" que fecha o painel e inicia o tour.

Ao criar uma página nova, **não** crie um wizard próprio a menos que o conteúdo realmente não
caiba no molde seção→passo (ex: preferir ilustrações ou interatividade específicas, como o
`FinanceHelpWizard`). O caso comum é só escrever a entrada no registry — o `PageHelpWizard` cuida
do resto.

---

## Verificação

```bash
npx tsc --noEmit   # rota sem ajuda em pt ou en = erro de tipo
npm run dev        # console avisa passo órfão e divergência pt/en (só em desenvolvimento)
```

Em desenvolvimento o registry compara os `id` dos passos e a contagem de seções entre `pt` e `en`
e avisa no console quando divergem — o compilador garante as rotas, não o conteúdo dentro delas.
