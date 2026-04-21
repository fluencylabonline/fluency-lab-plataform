# Adaptive Learning Engine — FluencyLab

Este documento descreve a arquitetura e o funcionamento do motor de Aprendizado Adaptativo da FluencyLab, abrangendo desde a fabricação de conteúdo (Módulo de Currículo) até a entrega inteligente e personalizada (Módulo de Aprendizado).

---

## 🏗️ Visão Geral da Arquitetura

O sistema segue o paradigma **Thin Client, Fat Server** e está fatiado verticalmente (Pragmatic DDD). Toda a inteligência reside nos **Services**, enquanto os **Repositories** lidam puramente com o banco de dados (Neon/Drizzle).

1.  **Fabricação (Curriculum)**: Transforma mídia bruta em "objetos de aprendizagem" estruturados, enriquecidos e tagueados com embeddings vetoriais.
2.  **Inteligência (Learning)**: Mapeia o perfil do aluno para as lições disponíveis (RAG) e gerencia a retenção de memória de longo prazo (SRS).

---

## 🎨 1. Fabricação de Conteúdo (Content Pipeline)

O processo de criação de uma lição segue um fluxo rigoroso de 9 passos, otimizado para performance e custo.

### O Pipeline de 9 Passos
1.  **Draft**: Definição de título, nível CEFR (A1-C2) e idioma.
2.  **Transcription**: O **Gemini 1.5 Pro/Flash** processa o vídeo/áudio, gerando o texto completo e timestamps palavra por palavra. *(Suporta SSE via `/api/curriculum/stream` para acompanhamento em tempo real na UI).*
3.  **Semantic Analysis**: IA extrai vocabulário relevante (lemmas) e estruturas gramaticais baseadas no nível da lição. *(Também suporta SSE para feedback em tempo real).*
4.  **Selection**: O administrador revisa e seleciona quais itens serão "core" e quais serão "secundários".
5.  **Enrichment (Batch Processing)**: 🚀 **Otimização de Lote:** Em vez de chamadas individuais por verbete, o sistema agora envia uma lista completa para a IA. Isso reduz o tempo total e consumo de tokens em até 70%.
6.  **Quiz Generation**: IA gera um quiz multimodal (transcrição, gramática, vocabulário e compreensão).
7.  **Review Quiz**: O administrador refina as perguntas e explicações pedagógicas.
8.  **Practice Building**: Geração automática de práticas (Flashcards, Gap Fill, Sentence Unscramble).
9.  **Vectorization (Embedding Caching)**: ⚡ **Hashing de Conteúdo:** O sistema gera um `contentHash` (SHA-256). Se o texto não mudou, a vetorização é pulada, economizando chamadas caras à API de Embeddings.

---

## 🚀 2. Implementação Técnica para UI (Specs)

### 📤 Gestão de Mídia (Direct Client Upload)
Para evitar que o servidor Next.js fique travado processando uploads de vídeos/áudios grandes, implementamos **URLs Assinadas (V4)**.

-   **Fluxo na UI**:
    1.  Chamar server action: `getSignedMediaUploadUrlAction({ fileName, contentType })`.
    2.  O servidor retorna uma `url` (GCS/Firebase) e o `path` final.
    3.  A UI deve fazer um **HTTP PUT** diretamente para a URL retornada.
    4.  Após o upload concluir no cliente, chamar `attachMediaAction({ lessonId, mediaUrl: path })`.

### 🗑️ Versionamento e Resiliência (Soft Delete)
Para garantir que alunos com planos de estudo ativos não sejam impactados por revisões de currículo, implementamos um sistema seguro de versionamento:
1.  **Edição via Clonagem**: Ao invés de alterar lições `ready`, a action `cloneLessonAction` cria uma nova versão (`v2`) e migra todas as referências de vocabulário e estruturas.
2.  **Soft Delete Imediato**: A versão anterior (`v1`) recebe imediatamente a tag `deleted_at = agora()`.
3.  **Impacto**: Novos alunos só encontrarão a `v2`. Alunos que já iniciaram a `v1` (via `lessonId`) continuam amarrados a ela até concluírem, garantindo progresso incontínuo e estável. Na listagem de gerenciamento, a UI pode ou não exibir essas lições legadas dependendo de filtros.

### 📉 Monitoramento de Difficulty Drift
O sistema monitora a eficácia pedagógica de cada lição.
-   **Métrica**: Taxa de falha (erro bruto) > 40% em pelo menos 50 tentativas de alunos.
-   **Ação**: Lições que falham nessa métrica devem ser sinalizadas na UI de gerenciamento para revisão do nível de dificuldade ou melhora do conteúdo.

---

## 🧠 3. Inteligência e Personalização (Delivery Engine)

### RAG (Retrieval Augmented Generation)
Para gerar um plano de estudos personalizado:
-   **Vector Search**: Busca de similaridade de cosseno via `pgvector` no Neon.
-   **Contextualization**: O perfil do aluno (`studentProfiles`) é atualizado a cada prática para refinar a busca de conteúdo.

### SRS (Spaced Repetition System)
-   **Maestria Cross-Contexto (A Nova Regra de 3)**: O aprendizado de um item só alcança o nível `MASTERED` se o aluno iteragir e acertar esse item dentro do contexto de **3 lições distintas**. O banco rastreia interações através da matriz `passedContextsIds`.
-   **Estabilidade Pós-Aula**: Alunos ficam "presos" ao `lessonId` exato. Caso o currículo original mude (nova versão), a base referencial do aluno não quebra.
-   **SM-2 Algorithm**: Motor empírico agnóstico onde o intervalo de repetição diverge naturalmente da curva de esquecimento, aplicando `easeFactor` refinado para predição.

---

## 🛠️ Referência de Server Actions

| Ação | Entrada | Objetivo |
| :--- | :--- | :--- |
| `createLessonAction` | `title, difficulty, languageId` | Passo 1: Início do fluxo. |
| `getSignedMediaUploadUrlAction` | `fileName, contentType` | Fundação para Upload Seguro. |
| `attachMediaAction` | `lessonId, mediaUrl` | Passo 2: Vincula mídia e dispara IA. |
| `analyzeLessonAction` | `lessonId` | Passo 3: Extração NLP. |
| `enrichItemsAction` | `lessonId, items[]` | Passo 5: Enriquecimento em Lote. |
| `finalizeLessonAction` | `lessonId` | Passo 9: Publicação e Vetorização. |

---

## 📏 4. Padrões Pedagógicos (B2+ Support)

-   **Synonyms**: O sistema agora suporta múltiplos sinônimos por item de vocabulário, essencial para níveis avançados.
-   **Imersão**: Traduções (`translation`) são opcionais e só devem ser exibidas até o nível B1. B2 em diante a UI deve focar em definições e sinônimos no idioma alvo.
