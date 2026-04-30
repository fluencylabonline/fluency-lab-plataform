# 📖 Guia de Integração: SRS & Adaptive Learning

Este guia detalha como utilizar as funções do sistema de aprendizado para construir a interface de prática (Flashcards, Quizzes) e gestão de planos de estudo.

---

## 🧠 1. Ciclo de Prática (SRS)

O ciclo de vida de um item no SRS depende da gravação de resultados de prática.

### `recordPracticeResultAction`
**Objetivo:** Gravar o desempenho do aluno em um item específico (vocabulário ou estrutura) e calcular a próxima data de revisão.

*   **Parâmetros (`recordPracticeResultSchema`):**
    *   `itemId`: (string) ID do item de aprendizagem (ex: `en_apple_vocabulary`).
    *   `lessonId`: (uuid) ID da lição onde a prática ocorreu (necessário para a Regra de Maestria).
    *   `quality`: (number, 0-5) Escala de qualidade da resposta:
        *   `0-2`: Falha (Esqueceu completamente ou errou feio).
        *   `3`: Acerto com muita dificuldade.
        *   `4`: Acerto com hesitação ou leve erro de digitação.
        *   `5`: Acerto perfeito e imediato.

*   **Retorno:**
    *   `interval`: (number) Dias até a próxima revisão.
    *   `nextReviewDate`: (Date) Data exata da próxima revisão.
    *   `status`: (`ACTIVE` | `RECEPTIVE` | `MASTERED`) Novo status do item.
    *   `distinctContexts`: (number) Em quantas lições diferentes o aluno já acertou este item.

---

## 🔓 2. Fluxo de Conteúdo (Drip-feed)

Os itens não aparecem no SRS do aluno magicamente. Eles precisam ser "liberados" através do estudo de lições.

### `startLessonAction`
**Objetivo:** Desbloquear os itens `CORE` de uma lição, movendo-os para o status `ACTIVE` no SRS do aluno. Deve ser chamado quando o aluno clica em "Iniciar Lição" ou completa o vídeo/texto.

*   **Parâmetros:**
    *   `lessonId`: (uuid) ID da lição.
*   **Retorno:** `{ success: true }`.

---

## 📶 3. Lógica Offline (Sincronização)

Para interfaces de prática em PWAs ou Mobile, use o sistema offline para garantir que o progresso não seja perdido sem internet.

### `useOfflineSync()` (Hook)
**Objetivo:** Gerenciar o estado da fila offline na UI.

*   **Propriedades Retornadas:**
    *   `isOnline`: (boolean) Status atual da conexão.
    *   `isSyncing`: (boolean) Se uma sincronização em lote está ocorrendo.
    *   `queueSize`: (number) Quantas práticas estão esperando para serem enviadas ao servidor.
    *   `savePractice(practice)`: Função para salvar uma prática localmente se estiver offline.
    *   `syncQueue()`: Tenta forçar a sincronização da fila.

### `syncPracticeBatchAction`
**Objetivo:** Sincronizar múltiplos resultados de uma vez (usado internamente pelo hook).
*   **Parâmetros:** Lista de objetos contendo `itemId`, `lessonId`, `quality` e `practicedAt` (timestamp da hora que ele realmente praticou).

---

## 🗺️ 4. Planos de Estudo e RAG

### `generatePlanAction`
**Objetivo:** Usar IA (pgvector) para encontrar as lições mais relevantes para o nível e interesses do aluno e criar um plano automático.
*   **Parâmetros:** `languageId` (uuid).
*   **Retorno:** `{ success: true, planId: string }`.

### `getStudentPlanGapAction`
**Objetivo:** Analisar se o aluno tem "buracos" no currículo (ex: tem aulas marcadas mas não tem lições atribuídas no plano).
*   **Parâmetros:** `studentId` (string).
*   **Retorno:** Dados de gap, total de aulas concluídas e progresso geral.

---

## ⚙️ 5. Regras de Negócio Importantes (Lembretes)

1.  **Regra de Maestria (Cross-Context):** Um item só se torna `MASTERED` se for acertado em pelo menos **3 lições diferentes**. Se o aluno praticar o mesmo item 10 vezes na mesma lição, o status ficará travado em `RECEPTIVE`.
2.  **Validade Offline:** O servidor rejeita práticas sincronizadas com mais de **7 dias** de atraso para não quebrar a integridade estatística do SM-2.
3.  **Ease Factor Mínimo:** O sistema nunca deixa a facilidade de um item cair abaixo de **1.3**.
4.  **Prioridade CORE:** Apenas itens marcados como `CORE` na fabricação da lição são inseridos automaticamente no SRS do aluno via `startLesson`. Itens `SECONDARY` ficam disponíveis apenas para consulta, a menos que uma lógica customizada os ative.

---

## 🚀 Exemplo de Fluxo na UI de Prática

1.  **Carregamento:** A UI busca itens que tenham `nextReviewDate <= agora()`.
2.  **Interação:** O aluno responde o Flashcard.
3.  **Captura:** O aluno (ou a IA de correção) define a `quality` (0-5).
4.  **Gravação:**
    ```tsx
    if (isOnline) {
      await recordPracticeResultAction({ itemId, lessonId, quality });
    } else {
      await savePractice({ itemId, lessonId, quality });
    }
    ```
5.  **Feedback:** A UI mostra o novo intervalo calculado (ex: "Vemos esse card novamente em 4 dias").
