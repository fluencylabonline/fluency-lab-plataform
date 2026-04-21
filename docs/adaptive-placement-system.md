# Adaptive Placement System (Diagnostic Engine)

O Sistema de Nivelamento Adaptativo da FluencyLab é um motor dinâmico projetado para avaliar a proficiência de idiomas de um aluno (A1 a C2) de forma eficiente, utilizando inteligência artificial para gerar conteúdo e o algoritmo Elo para ajustar a dificuldade em tempo real.

## 🏗️ Arquitetura e Fluxo

O sistema é dividido em dois grandes workflows: o administrativo (geração de conteúdo) e o do estudante (execução do teste).

### 1. Loop de Diagnóstico Administrativo
Diferente de sistemas estáticos, o FluencyLab gera questões de nivelamento baseadas diretamente no currículo real da plataforma.

1.  **Sourcing**: O sistema busca `learning_items` (vocabulário ou estruturas) do módulo de `curriculum`.
2.  **AI Generation**: O `aiService` utiliza o modelo Gemini para transformar esses itens em questões de múltipla escolha.
3.  **Habilidades**: Cada lote de geração cria questões equilibradas entre:
    *   **Grammar** (Estruturas fundamentais)
    *   **Vocabulary** (Itens lexicais)
    *   **Reading** (Compreensão de texto/contexto)
    *   **Listening** (Compreensão auditiva via monólogos e TTS)
4.  **Storage**: As questões são salvas na tabela `questions`, vinculadas ao `learning_item_id` original, permitindo diagnosticar exatamente quais lacunas o aluno possui.

### 2. Pipeline Adaptativo do Estudante
O teste ajusta-se à performance do aluno a cada resposta.

*   **Fila Circular de Habilidades**: Para garantir uma avaliação holística, o sistema alterna a habilidade a cada questão (Grammar -> Vocab -> Reading -> Listening -> Grammar...).
*   **Algoritmo Elo**: 
    *   O teste começa com o Elo atual do aluno (ou 600/A1 padrão).
    *   **Acerto**: O Elo sobe. A próxima questão selecionada será mais difícil.
    *   **Erro**: O Elo desce. A próxima questão será mais fácil.
*   **Estabilidade**: O teste termina após um número fixo de questões (ex: 25) ou quando o Elo estabiliza, resultando em um nível CEFR final (A1-C2).

## 🗄️ Esquema de Dados

### Tabelas Principais (placement.schema.ts)
*   **`questions`**: Banco de questões geradas por IA.
    *   `content`: O texto da pergunta.
    *   `context`: Contexto situacional opcional.
    *   `audio_script`: Texto para TTS (apenas para Listening).
    *   `skill`: A habilidade testada.
    *   `cefrLevel`: Nível de dificuldade estimado.
*   **`placement_tests`**: Sessão ativa do aluno.
    *   `status`: `in_progress`, `completed`, `abandoned`.
    *   `initialEloScore` / `finalEloScore`.
*   **`test_answers`**: Registro histórico de cada resposta para análise posterior.

## 🚀 Como Usar

### Geração de Questões (Admin)
Para popular o banco de questões de um idioma específico:

```typescript
import { placementService } from "@/modules/placement/placement.service";

// Gera 20 questões de nível B1 para Inglês
await placementService.generateBulkQuestions(
  languageId, 
  "B1", 
  20
);
```

### Execução do Teste (Client Action)
O frontend interage com o sistema através de Server Actions que chamam o `placementService`:

1.  **Iniciar**: `placementService.startOrResumeTest(userId, languageId)`
2.  **Próxima Questão**: `placementService.getNextQuestion(...)`
3.  **Responder**: `placementService.submitAnswer(...)`

## 🛡️ Segurança e Limites
*   **Cooldown**: Um aluno só pode realizar o teste de nivelamento uma vez a cada 6 meses (`checkEligibility`).
*   **Rate Limit**: A geração por IA é limitada por usuário administrativo para evitar custos inesperados.
*   **JSON Sanitization**: O sistema possui utilitários para limpar respostas da IA que contenham markdown ou textos explicativos, garantindo a integridade dos dados.

## 🧪 Validação
Existe um script de teste E2E para validar todo o pipeline (da criação da lição à geração de questões):
`npx tsx scripts/test-placement-e2e.ts`
