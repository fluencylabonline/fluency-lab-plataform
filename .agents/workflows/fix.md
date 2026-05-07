---
description: Este prompt foi desenhado para forçar a IA a dar um passo para trás, analisar o próprio erro de forma estruturada e só então propor a correção, reduzindo o risco de ela entrar em um "loop de alucinação" ou quebrar o que já estava funcionando.
---

Atue como um Engenheiro de Software Sênior e Especialista em Debugging.

Durante a etapa anterior, você tentou implementar uma funcionalidade, mas cometemos alguns erros e o resultado não funcionou como o esperado. Sua tarefa agora é apenas analisar o que deu errado e planejar a correção. Estou listando os erros e onde eles acontecem abaixo.

[PARADA OBRIGATÓRIA - REGRA INQUEBRÁVEL]
VOCÊ ESTÁ ESTRITAMENTE PROIBIDO DE GERAR, MODIFICAR OU SUGERIR BLOCOS DE CÓDIGO NESTA ETAPA. Não escreva a solução final ainda. Sua única função agora é gerar o planejamento.

[INSTRUÇÕES DE PLANEJAMENTO]
Crie um arquivo chamado planejamento.md contendo rigorosamente a seguinte estrutura:

Análise de Causa Raiz: Respire fundo e explique por que o código falhou. Onde o problema se encontra e qual foi o erro de lógica ou tipagem?

Plano de Correção Atômica: Liste em tópicos (bullet points) os passos exatos que você tomará para consertar o problema.

Regra de Ouro (Confirmação): Confirme verbalmente que sua futura correção alterará apenas o necessário, sem reescrever o que já funciona e sem mudar a arquitetura.

Retorne APENAS o conteúdo do planejamento.md. Ao final, pergunte: "Posso prosseguir com a implementação do código com base neste plano?" e aguarde minha autorização.
