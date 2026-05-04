# Guia de Extensões Tiptap, Persistência via Atributos e Serviços Úteis

Este guia resume como criar extensões Tiptap baseadas em Node, como usar atributos para persistir estado de interação (respostas do usuário), e quais serviços/repositórios da base podem ajudar em upload, deleção e armazenamento de dados.

## Visão Geral
- Extensões Tiptap do tipo Node permitem encapsular UI interativa e estado no documento.
- A persistência de respostas é feita salvando dados no próprio Node através de `updateAttributes`, evitando dependência de usuários/logins quando desejado.
- Para mídia (imagem/áudio), use rotas autenticadas e utilitários para upload e limpeza de Storage.

## Criando uma Extensão Node
- Defina o Node com:
  - `addAttributes` para listar atributos como `mode`, `question`, `deck`.
  - `parseHTML` e `renderHTML` para suportar inserção via HTML (útil para fallback).
  - `addCommands` para comandos de inserção/atualização.
  - `addNodeView` para renderizar um React NodeView com UI interativa.
- Exemplo real:
  - Atributos: `components/tiptap/extensions/Questions/QuestionsNode.tsx:749`
  - Parse/Render: `components/tiptap/extensions/Questions/QuestionsNode.tsx:757` e `components/tiptap/extensions/Questions/QuestionsNode.tsx:804`
  - Comandos: `components/tiptap/extensions/Questions/QuestionsNode.tsx:821`
  - NodeView: `components/tiptap/extensions/Questions/QuestionsNode.tsx:853`

## NodeView e Persistência com `updateAttributes`
- O NodeView recebe `node` e `updateAttributes`.
- Para persistir respostas:
  - Pergunta isolada: atualize `question.useranswer`.
  - Deck: use mapa `deck.useranswers[questionId]` para guardar cada resposta.
- Referências:
  - Pergunta: `components/tiptap/extensions/Questions/QuestionsNode.tsx:163` (atualiza e valida)
  - Deck: `components/tiptap/extensions/Questions/QuestionsNode.tsx:450` (salva no atributo `deck.useranswers`)

### Estados úteis no NodeView
- `isCorrect` e feedback visual por pergunta
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:192`
- Inputs e botões por tipo de pergunta:
  - Múltipla escolha: `components/tiptap/extensions/Questions/QuestionsNode.tsx:251`
  - Verdadeiro/Falso: `components/tiptap/extensions/Questions/QuestionsNode.tsx:308`
  - Completar: `components/tiptap/extensions/Questions/QuestionsNode.tsx:336`

## Deck Interativo
- Carrega as perguntas do deck (Firestore) e renderiza uma por vez, com navegação.
- Persistência:
  - Respostas ficam em `deck.useranswers`.
  - Estado de colapso fica em `deck.collapsed`.
- Referências:
  - Carregamento dos `questionIds`: `components/tiptap/extensions/Questions/QuestionsNode.tsx:399`
  - Salvar resposta no deck: `components/tiptap/extensions/Questions/QuestionsNode.tsx:450`
  - Navegação: `components/tiptap/extensions/Questions/QuestionsNode.tsx:443` e `components/tiptap/extensions/Questions/QuestionsNode.tsx:446`
  - Colapsar/expandir e persistir: `components/tiptap/extensions/Questions/QuestionsNode.tsx:397` e `components/tiptap/extensions/Questions/QuestionsNode.tsx:705`

## Inserindo o Node no Editor
- Inserção via HTML (compatível com `parseHTML`) ou `chain().insertContent(...)`.
- Exemplo de inserção a partir do modal:
  - `insertQuestionsNode`: `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:160`
  - Salvar nova pergunta e inserir: `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:191`
  - Inserir pergunta existente: `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:303`
  - Salvar deck e inserir: `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:320`

## Firestore: criar, editar, deletar
- Criação de perguntas:
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:191`
- Edição de perguntas:
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:243`
- Deleção de perguntas (com limpeza de Storage se houver mídia):
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:597` (UI)
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx` contém `handleDeleteQuestion` que usa `deleteDoc` e `deleteImageByUrl` para mídia.

## Upload e Limpeza de Mídia
- Utilitários (cliente):
  - `handleImageUpload`: `lib/tiptap-utils.ts:357`
  - `handleAudioUpload`: `lib/tiptap-utils.ts:413`
  - `deleteImageByUrl`: `lib/tiptap-utils.ts:468`
- Rotas (servidor):
  - Upload de imagem: `app/api/editor/upload-image/route.ts:5`
  - Upload de áudio: `app/api/editor/upload-audio/route.ts:5`
  - Deleção de imagem/arquivo: `app/api/editor/delete-image/route.ts:27`
- Limites e tipos:
  - Imagem: até 5MB no utilitário padrão; no modal aplicamos 2MB e tipos aceitos.
  - Áudio: até 4MB e tipos aceitos.
  - YouTube como alternativa de áudio: aceito via URL ao salvar/editar.

## Autenticação e Segurança
- Verificação de usuário nas rotas:
  - `requireAuth`: `lib/auth.ts:20`
  - Todas rotas de upload/remoção exigem autenticação.
- Admin Storage para escrita via servidor:
  - `lib/firebase/admin.ts` inicializa acesso admin ao Storage.

## Padrões de Serviços/Repos
- Prefira:
  - Um serviço para upload/remoção de arquivos (já exposto via rotas).
  - Um repositório/serviço para perguntas (`questions`) e decks (`questions_decks`):
    - Criar/editar/deletar perguntas e decks.
    - Encapsular `collection`, `addDoc`, `updateDoc`, `deleteDoc`.
  - Ex.: hoje o modal (`QuestionsToolModal`) centraliza estas operações; para escalar, mova para `repositories/questionsRepository.ts` e `services/questionsService.ts`.

## Boas Práticas com Atributos
- Use objetos simples serializáveis (sem funções) nos atributos do Node.
- Ao atualizar:
  - Crie um novo objeto e passe a `updateAttributes({ key: nextValue })`.
  - Evite inserir `undefined` em estruturas destinadas ao Firestore.
- Exemplo:
  - `question.useranswer` para uma pergunta isolada.
  - `deck.useranswers[questionId]` para respostas por pergunta em um deck.
  - `deck.collapsed` para o estado de colapso do deck.

## Referências de Código
- Node e NodeView:
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:749`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:757`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:804`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:821`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:853`
- Persistência de respostas:
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:163`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:450`
- Deck colapsável:
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:397`
  - `components/tiptap/extensions/Questions/QuestionsNode.tsx:705`
- Modal e inserção:
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:160`
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:191`
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:303`
  - `components/tiptap/extensions/Questions/QuestionsToolModal.tsx:320`
- Upload/Limpeza:
  - `lib/tiptap-utils.ts:357`
  - `lib/tiptap-utils.ts:413`
  - `lib/tiptap-utils.ts:468`
  - `app/api/editor/upload-image/route.ts:5`
  - `app/api/editor/upload-audio/route.ts:5`
  - `app/api/editor/delete-image/route.ts:27`
- Autenticação:
  - `lib/auth.ts:20`
  - `lib/firebase/admin.ts:1`

## Dicas Finais
- Sempre valide tipo e tamanho de arquivos no cliente e no servidor.
- Para extensões que precisam de estado reativo complexo, mantenha o mínimo essencial nos atributos e derive o resto com estado local no NodeView.
- Use `parseHTML` + `insertContent(html)` como fallback robusto de inserção, e `addCommands` para ergonomia.

