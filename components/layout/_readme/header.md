# Header

Componente de cabeçalho adaptativo com suporte a busca expansível, botão de ação, menu de usuário e sub-header. Comportamento diferenciado entre mobile e desktop com animações via Framer Motion.

---

## Instalação

O componente depende dos seguintes pacotes e utilitários internos:

```bash
npm install framer-motion lucide-react
```

Dependências internas necessárias:

```
@/lib/utils               → cn()
@/hooks/ui/useMobile      → useIsMobile()
@/components/ui/button    → Button, buttonVariants
@/components/ui/input     → Input
@/components/ui/theme-switcher → ThemeSwitcher
@/modules/notification/_components/NotificationBell
./user-menu               → UserMenu
```

---

## Uso básico

```tsx
import { Header } from "@/components/layout/header";

export default function Page() {
  return (
    <Header
      title="Dashboard"
      subtitle="Visão geral da sua conta"
      user={{
        name: "Ana Costa",
        email: "ana@empresa.com",
        photoUrl: "/avatar.png",
        role: "admin",
      }}
    />
  );
}
```

---

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `title` | `string` | — | Título principal. Obrigatório. |
| `subtitle` | `string` | — | Descrição exibida no sub-header. |
| `backHref` | `string` | — | Exibe botão de voltar com link. |
| `onSearchChange` | `(value: string) => void` | — | Ativa o campo de busca quando fornecido. |
| `actionButton` | `React.ReactNode` | — | Botão ou elemento de ação no canto direito. |
| `showSubHeader` | `boolean` | `true` | Exibe ou oculta a faixa inferior com subtitle e ações. |
| `user` | `UserObject` | — | Dados do usuário para o `UserMenu`. |
| `className` | `string` | — | Classes extras no wrapper externo. |

Aceita também todas as props nativas de `HTMLDivElement` via `...props`.

### Tipo `UserObject`

```ts
{
  name: string | null;
  email: string | null;
  photoUrl?: string | null;
  role?: string;
}
```

---

## Anatomia do componente

O `Header` é composto por duas faixas verticais:

```
┌─────────────────────────────────────────────────────────┐
│  header (sticky, h-14)                                  │
│  [← back]    [title — desktop only]    [search/actions] │
├─────────────────────────────────────────────────────────┤
│  sub-header (showSubHeader=true)                        │
│  [subtitle]                    [search expandido] [CTA] │
└─────────────────────────────────────────────────────────┘
```

No **mobile**, o título migra para o sub-header em tamanho maior (`text-2xl`), e o header principal exibe apenas ícones de ação. No **desktop**, o título fica centralizado no header principal e o sub-header exibe o subtitle + ações.

---

## Comportamento de busca

A busca só aparece quando `onSearchChange` é fornecido. O comportamento varia por breakpoint:

**Mobile** — ao clicar no ícone de busca, o header inteiro é substituído por um campo de texto em tela cheia com animação de entrada/saída. Fechar limpa o valor e chama `onSearchChange("")`.

**Desktop** — um botão circular no sub-header expande horizontalmente (spring animation) para revelar o input. O campo fecha ao clicar no X ou ao perder o foco via botão.

```tsx
const [query, setQuery] = useState("");

<Header
  title="Usuários"
  onSearchChange={setQuery}
/>

// use `query` para filtrar seus dados
const filtered = users.filter((u) =>
  u.name.toLowerCase().includes(query.toLowerCase())
);
```

---

## Exemplos

### Página simples sem busca

```tsx
<Header
  title="Configurações"
  subtitle="Gerencie suas preferências"
  user={currentUser}
/>
```

### Página com navegação hierárquica

```tsx
<Header
  title="Detalhes do pedido"
  backHref="/pedidos"
  user={currentUser}
/>
```

### Com botão de ação

```tsx
<Header
  title="Produtos"
  subtitle="Gerencie o catálogo"
  actionButton={
    <Button onClick={() => router.push("/produtos/novo")}>
      Novo produto
    </Button>
  }
  user={currentUser}
/>
```

### Com busca e ação combinadas

No desktop, quando a busca está aberta e há um `subtitle`, o `actionButton` se oculta automaticamente em telas menores que `lg` para evitar estouro de layout. Em `lg:` ele reaparece.

```tsx
<Header
  title="Clientes"
  subtitle="Lista completa de clientes ativos"
  onSearchChange={setQuery}
  actionButton={<Button>Exportar</Button>}
  user={currentUser}
/>
```

### Header sem sub-header

Útil em modais, drawers ou páginas com layout próprio abaixo do header.

```tsx
<Header
  title="Editor"
  showSubHeader={false}
  user={currentUser}
/>
```

### Layout com sidebar

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title="Dashboard"
          subtitle="Bem-vindo de volta"
          user={currentUser}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## Estilização

O componente usa duas classes CSS customizadas que você deve definir no seu projeto:

```css
/* globals.css */

.header-layout {
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid hsl(var(--border));
}

.sub-header-layout {
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
}
```

Adapte conforme o design system do projeto. Sem essas classes, o header ainda funciona, mas sem background e borda.

---

## Boas práticas

### Mantenha o título curto

O título é truncado com `truncate` em ambos os breakpoints. Títulos longos são cortados silenciosamente — use o `subtitle` para contexto adicional.

```tsx
// ✅ correto
title="Relatórios"
subtitle="Acompanhe os resultados do trimestre"

// ❌ evite
title="Relatórios de desempenho do trimestre atual"
```

### Não controle `isSearchOpen` externamente

O estado de abertura da busca é interno ao componente. Você só precisa reagir ao valor digitado via `onSearchChange`. Tentar sincronizar esse estado externamente cria acoplamento desnecessário.

```tsx
// ✅ só reaja ao valor
const [query, setQuery] = useState("");
<Header onSearchChange={setQuery} />

// ❌ não tente controlar a abertura
const [open, setOpen] = useState(false); // não há como passar isso
```

### `actionButton` deve ser um elemento já configurado

Não passe handlers ou lógica de navegação dentro do Header — passe o botão pronto.

```tsx
// ✅ botão pronto
<Header
  actionButton={<Button onClick={handleCreate}>Criar</Button>}
/>

// ❌ evite lógica de negócio dentro do nó
<Header
  actionButton={
    <Button onClick={() => {
      validatePermissions();
      router.push("/novo");
    }}>
      Criar
    </Button>
  }
/>
// extraia a função para fora
```

### Use `backHref` apenas para navegação real

O botão de voltar usa `<Link href>`, não `router.back()`. Use somente quando a URL de destino for fixa e conhecida. Para histórico dinâmico, implemente o botão no `actionButton` ou fora do Header.

```tsx
// ✅ URL fixa
<Header backHref="/pedidos" title="Detalhes" />

// ❌ para histórico dinâmico, não use backHref
// implemente fora do Header
<button onClick={() => router.back()}>Voltar</button>
```

### Evite re-renders desnecessários em `onSearchChange`

Se o callback disparar filtragem pesada, use `useDeferredValue` ou debounce:

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);

// use deferredQuery para filtrar, não query diretamente
const filtered = useMemo(
  () => items.filter((i) => i.name.includes(deferredQuery)),
  [items, deferredQuery]
);

<Header onSearchChange={setQuery} />
```

---

## Acessibilidade

O componente já inclui:

- `sr-only` no botão de voltar com texto "Voltar"
- `autoFocus` no input de busca ao abrir
- `AnimatePresence` com `mode="wait"` garantindo que elementos removidos do DOM saiam antes dos novos entrarem

Recomendações adicionais:

```tsx
// Adicione aria-label ao header quando houver múltiplos na página
<Header
  title="Produtos"
  // adicione no wrapper via className ou props nativas
  aria-label="Cabeçalho da página de produtos"
/>
```

---

## Dependências

| Pacote | Versão mínima | Uso |
|--------|--------------|-----|
| `framer-motion` | ^11 | Animações de busca e transições |
| `lucide-react` | ^0.400 | Ícones ArrowLeft, Search, X |
| `next` | ^14 | `Link` para o botão de voltar |
| `tailwindcss` | ^3.4 | Estilização e responsividade |