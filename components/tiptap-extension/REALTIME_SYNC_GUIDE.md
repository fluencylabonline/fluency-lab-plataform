# Guia: Extensões Tiptap com Sincronização em Tempo Real

Este guia documenta o padrão para criar extensões Tiptap cujo estado é sincronizado em **tempo real entre múltiplos usuários** via Firebase Realtime Database (RTDB).

> Referência de implementação: `components/tiptap-extension/youtube-sync/`

---

## Visão Geral do Padrão

```
┌─────────────────────────────────────────────────────────────────┐
│  Usuário A (ex: professor)          Usuário B (ex: aluno)       │
│                                                                  │
│  NodeView                           NodeView                    │
│  └─ onStateChange ──────────────►  └─ onValue (Firebase)       │
│       └─ publishState()                  └─ applyRemoteState()  │
│            └─ set(rtdb, path, state)          └─ player.sync()  │
└─────────────────────────────────────────────────────────────────┘
```

O RTDB funciona como um "mensageiro" persistente:
- **Publicar:** quando o usuário local interage, escreve o estado atual no RTDB.
- **Escutar:** `onValue` entrega o estado atual imediatamente ao conectar (e a cada mudança).
- **Anti-loop:** cada estado carrega `lastUpdatedBy: userId`; o receptor ignora eventos seus próprios.

---

## Estrutura de Arquivos

```
components/tiptap-extension/[nome]/
├── [Nome]Node.ts          ← Definição do Node Tiptap (puro TS, sem React)
├── [Nome]View.tsx         ← NodeView React ("use client", Firebase, UI)
├── [Nome]ToolbarButton.tsx← Botão de toolbar para inserção (opcional)
└── [nome].css             ← Estilos isolados da extensão
```

---

## 1. Definindo o Estado Sincronizado

Crie uma interface para o estado que será salvo no RTDB. Use **apenas tipos primitivos** (string, number, boolean) — sem funções, Date ou objetos complexos.

```ts
// [Nome]View.tsx

export interface MySyncState {
  // Campos de estado
  value: string;
  isActive: boolean;
  // Campos obrigatórios de metadados (SEMPRE inclua estes dois)
  lastUpdatedBy: string; // userId — usado para anti-loop
  updatedAt: number;     // Date.now() — usado para interpolação de tempo
}
```

---

## 2. Definindo os Atributos do Node

Os atributos do Node são persistidos **no próprio documento Tiptap** (HTML/JSON). São os dados "estáticos" do node, não os de sincronização em tempo real.

```ts
// [Nome]Node.ts

export interface MyNodeAttributes {
  nodeId: string; // ID único gerado no momento da inserção — chave do RTDB
  // ... outros atributos do documento
}

export const MyNode = Node.create({
  name: "myNode",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      nodeId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-node-id"),
        renderHTML: (attrs) => ({ "data-node-id": attrs.nodeId }),
      },
      // ...
    };
  },

  addCommands() {
    return {
      insertMyNode:
        (attrs?: Partial<MyNodeAttributes>) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: `my_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              ...attrs,
            },
          }),
    } as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(MyNodeView);
  },
});
```

> **Por que `nodeId` no atributo?**
> O `nodeId` é a chave no RTDB (`my-extension/${nodeId}`). Ao ser persistido no documento, todos os usuários que abrirem o mesmo notebook verão o mesmo `nodeId` e assinarão o mesmo nó do RTDB.

---

## 3. Implementando o NodeView com Sync

```tsx
// [Nome]View.tsx
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ref, onValue, set, off, DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import type { MyNodeAttributes, MySyncState } from "./types";

const SYNC_TOLERANCE = 2; // unidade depende do estado (ex: segundos, px, %)

export function MyNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const { nodeId } = node.attrs as MyNodeAttributes;

  // Ref para evitar loop: true enquanto estamos aplicando estado remoto
  const isSyncingRef = useRef(false);

  // ── 1. Publicar estado local → RTDB ─────────────────────────────────────
  const publishState = useCallback((newState: Omit<MySyncState, "lastUpdatedBy" | "updatedAt">) => {
    if (!nodeId) return;
    const payload: MySyncState = {
      ...newState,
      lastUpdatedBy: (globalThis as any).__userId ?? "anonymous",
      updatedAt: Date.now(),
    };
    set(ref(rtdb, `my-extension/${nodeId}`), payload).catch(console.error);
  }, [nodeId]);

  // ── 2. Escutar RTDB → aplicar estado remoto ──────────────────────────────
  useEffect(() => {
    if (!nodeId) return;

    const syncRef = ref(rtdb, `my-extension/${nodeId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const state: MySyncState | null = snapshot.val();
      if (!state) return;

      // Anti-loop: ignora eventos gerados por mim mesmo
      const myId = (globalThis as any).__userId ?? "anonymous";
      if (state.lastUpdatedBy === myId) return;

      isSyncingRef.current = true;
      try {
        applyRemoteState(state); // aplica o estado na UI/player/etc
      } finally {
        setTimeout(() => { isSyncingRef.current = false; }, 300);
      }
    };

    onValue(syncRef, handleSnapshot);
    return () => off(syncRef, "value", handleSnapshot);
  }, [nodeId]);

  // ── 3. Interação local → publicar se não for sync remoto ─────────────────
  const handleLocalChange = (newValue: string) => {
    if (isSyncingRef.current) return; // estava aplicando estado remoto, ignora
    publishState({ value: newValue, isActive: true });
  };

  return (
    <NodeViewWrapper>
      {/* UI da extensão */}
    </NodeViewWrapper>
  );
}
```

---

## 4. Regras de Segurança no RTDB

Adicione no `database.rules.json` um nó para cada extensão. **Nunca use `allow read, write: if true`.**

```json
{
  "rules": {
    "my-extension": {
      "$nodeId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || data.child('lastUpdatedBy').val() === auth.uid || newData.child('lastUpdatedBy').val() === auth.uid)"
      }
    }
  }
}
```

Após editar, faça deploy:
```bash
firebase deploy --only database
```

---

## 5. Expondo o `userId` para os NodeViews

O `__userId` no `globalThis` é o mecanismo para os NodeViews saberem quem é o usuário atual sem precisar de Context/props extras.

Isso deve ser feito **uma única vez** no `NotebookEditor.tsx`, dentro de um `useEffect`:

```tsx
// NotebookEditor.tsx
useEffect(() => {
  (globalThis as Record<string, unknown>).__userId = userId;
}, [userId]);
```

> ⚠️ **Não faça isso no corpo do componente** — viola a regra de pureza do React Compiler. Sempre dentro de `useEffect`.

---

## 6. Lógica de Reconexão

O Firebase RTDB entrega o estado atual **imediatamente ao (re)conectar** via `onValue`. Isso significa que reconexões são tratadas automaticamente — nenhum código adicional é necessário.

### Porém: drift de tempo

Se o estado remoto incluir `currentTime` (como em um player de vídeo/áudio), use interpolação para corrigir o tempo decorrido desde o último evento:

```ts
const handleSnapshot = (snapshot: DataSnapshot) => {
  const state: MySyncState = snapshot.val();
  if (!state) return;

  // Interpolação de tempo: compensa o drift
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  const realTime = state.isPlaying
    ? state.currentTime + elapsed
    : state.currentTime;

  player.seekTo(realTime);
};
```

Sem isso, um usuário que reconecta vai iniciar atrasado em relação ao que está tocando ao vivo.

---

## 7. Anti-loop: evitando ciclos de sincronização

O loop aconteceria assim:
```
Local: play → onStateChange → publishState → RTDB → onValue → applyState → onStateChange → publishState → ...
```

Dois mecanismos para quebrá-lo:

### 7.1 `isSyncingRef`
```ts
const isSyncingRef = useRef(false);

// Antes de aplicar estado remoto:
isSyncingRef.current = true;
applyState(state);
setTimeout(() => { isSyncingRef.current = false; }, 300);

// No handler de eventos locais:
if (isSyncingRef.current) return; // ignora eventos disparados pelo sync
```

### 7.2 `lastUpdatedBy`
```ts
// No snapshot handler:
if (state.lastUpdatedBy === myUserId) return; // ignora meus próprios eventos
```

Use **ambos** juntos para cobertura total.

---

## 8. Caminho do RTDB — Convenção de Nomenclatura

```
[nome-da-extensão-kebab-case]/${nodeId}

Exemplos:
  youtube-sync/yt_1748473200000_abc123
  audio-sync/audio_1748473200000_xyz789
  whiteboard-sync/wb_1748473200000_def456
```

O `nodeId` é único por node inserido no documento — dois nodes diferentes da mesma extensão terão caminhos diferentes no RTDB.

---

## 9. Checklist para Nova Extensão Sincronizada

- [ ] Criar `MySyncState` com `lastUpdatedBy` e `updatedAt`
- [ ] Criar `MyNodeAttributes` com `nodeId` como atributo persistido
- [ ] `publishState()` dentro de `useCallback` com `[nodeId]` como dep
- [ ] `onValue` + `off` dentro de `useEffect` com `[nodeId]` como dep
- [ ] `isSyncingRef` para anti-loop local
- [ ] Filtro `lastUpdatedBy === myId` para anti-loop remoto
- [ ] Interpolação de tempo se o estado tiver `currentTime`
- [ ] Regra no `database.rules.json` para o novo caminho
- [ ] `firebase deploy --only database`
- [ ] `__userId` exposto no `NotebookEditor.tsx` via `useEffect`

---

## Referência Completa

| Arquivo | Propósito |
|---|---|
| `youtube-sync/YoutubeSyncNode.ts` | Exemplo de Node com `nodeId` e `url` |
| `youtube-sync/YoutubeSyncView.tsx` | Exemplo completo com YT IFrame API + RTDB sync |
| `database.rules.json` | Regras de segurança do RTDB |
| `lib/firebase.ts` | Export `rtdb` (Firebase Realtime Database client) |
| `app/.../NotebookEditor.tsx` | Onde `__userId` é exposto no `globalThis` |
