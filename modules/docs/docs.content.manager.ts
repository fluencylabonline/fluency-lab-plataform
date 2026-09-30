import type { DocSection } from "./docs.types";

/** Central de Ajuda do Manager (equipe de suporte e pedagógico). */
export const MANAGER_DOCS: DocSection[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: "mgr-inicio",
    title: "Começando",
    description: "Seu papel na operação e os limites do seu acesso.",
    icon: "Compass",
    articles: [
      {
        id: "mgr-papel",
        title: "O que o manager faz",
        summary: "Onde você atua e o que fica restrito ao admin.",
        keywords: ["papel", "função", "permissão", "acesso", "limite", "gerente"],
        blocks: [
          {
            type: "p",
            text: "O manager é a linha de frente: dá suporte a alunos e professores, cuida do material didático e acompanha o onboarding. Seu acesso é amplo no pedagógico e no atendimento, e propositalmente limitado no financeiro e no cadastral.",
          },
          {
            type: "fields",
            title: "Você pode",
            items: [
              { name: "Suporte a alunos", does: "Abrir a ficha de qualquer aluno, ver histórico e resolver pendências do dia a dia." },
              { name: "Suporte a professores", does: "Acompanhar agendas e ajudar em ajustes de aula." },
              { name: "Créditos", does: "Conceder créditos de reposição quando a situação justificar." },
              { name: "Material didático", does: "Criar, editar e publicar lições, itens de aprendizado e testes de nivelamento." },
              { name: "Aulas", does: "Ajustar o status de qualquer aula quando o professor não conseguir." },
              { name: "Conversas", does: "Atender alunos pelo WhatsApp da escola." },
            ],
          },
          {
            type: "fields",
            title: "Fica com o admin",
            items: [
              { name: "Criar e desativar usuários", does: "Cadastro de novas contas e encerramento de matrícula." },
              { name: "Financeiro completo", does: "Transações, impostos, planos e confirmação de pagamentos." },
              { name: "Contratos", does: "Modelos de contrato e dados jurídicos da escola." },
              { name: "Dados sensíveis", does: "Revelar CPF, telefone e endereço de usuários." },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Precisou de algo fora do seu alcance?",
            text: "Não é falta de confiança — é separação de responsabilidade. Encaminhe ao admin: são ações que exigem confirmação de senha e ficam registradas em auditoria.",
          },
        ],
      },
      {
        id: "mgr-visao-geral",
        title: "O que tem em cada área",
        summary: "Um mapa rápido do seu menu.",
        keywords: ["menu", "áreas", "navegação", "onde fica", "mapa"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Meu Perfil", does: "Seus dados e preferências." },
              { name: "Usuários", does: "Busca e ficha de alunos e professores, para dar suporte." },
              { name: "Conversas", does: "Caixa de entrada do WhatsApp da escola." },
              { name: "Aprendizado", does: "Material didático: lições, itens, nivelamento e indicadores." },
              { name: "Meu Aprendizado", does: "Cursos de formação em que você está matriculado." },
              { name: "Tarefas", does: "Gestor de tarefas e projetos da equipe." },
              { name: "Configurações", does: "Senha, notificações e preferências." },
            ],
          },
          {
            type: "p",
            text: "O **Onboarding de alunos** fica dentro da área de Usuários e lista os perfis de entrada dos novos matriculados.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "mgr-suporte",
    title: "Suporte a Alunos",
    description: "Atendimento, ficha do aluno, créditos e onboarding.",
    icon: "Users",
    articles: [
      {
        id: "mgr-ficha-aluno",
        title: "Ficha do aluno",
        summary: "O que você consegue ver e resolver na ficha de um aluno.",
        route: "/hub/manager/users",
        keywords: ["ficha", "aluno", "detalhes", "histórico", "suporte", "buscar"],
        blocks: [
          {
            type: "p",
            text: "A busca encontra por nome, e-mail ou telefone. Abrindo a ficha você vê o quadro completo do aluno: dados de contato, situação de pagamento, contrato, aulas, currículo e certificado.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Campos mascarados",
            text: "CPF, telefone completo e endereço aparecem ocultos e só o admin consegue revelá-los. Se o atendimento exigir confirmar um documento, encaminhe ao admin.",
          },
        ],
      },
      {
        id: "mgr-creditos",
        title: "Conceder créditos de reposição",
        summary: "Quando dar um crédito e o que isso significa para o aluno.",
        keywords: ["crédito", "reposição", "bônus", "compensação", "aula extra", "conceder"],
        blocks: [
          {
            type: "p",
            text: "Crédito é o direito a uma aula extra. O aluno o usa para agendar uma reposição sem gastar a cota de 2 remarcações mensais dele.",
          },
          {
            type: "fields",
            title: "Tipos de crédito",
            items: [
              { name: "Cancelamento do professor", does: "Gerado automaticamente quando o professor cancela. Você não precisa fazer nada." },
              { name: "Atraso da escola", does: "Para quando houve falha do nosso lado que prejudicou a aula." },
              { name: "Bônus", does: "Cortesia ou compensação combinada — use com critério e registre o motivo no atendimento." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Todo crédito tem validade",
            text: "Ao conceder, defina uma validade realista e avise o aluno. Crédito vencido some e costuma virar reclamação depois.",
          },
          {
            type: "note",
            variant: "danger",
            title: "Aula com crédito cancelada perde o crédito",
            text: "Se o aluno agendar uma reposição com crédito e depois cancelá-la, o crédito é consumido. Deixe isso claro no atendimento antes de ele confirmar o horário.",
          },
        ],
      },
      {
        id: "mgr-regras-aula",
        title: "Regras de cancelamento e remarcação",
        summary: "As regras que você mais vai explicar no atendimento.",
        keywords: ["regra", "cancelar", "remarcar", "4 horas", "limite", "falta", "política"],
        blocks: [
          {
            type: "p",
            text: "Domine estas regras: elas são a origem da maior parte das dúvidas que chegam no atendimento.",
          },
          {
            type: "table",
            headers: ["Situação", "Regra"],
            rows: [
              ["Aluno cancela com mais de 4h", "Cancelamento normal, sem falta."],
              ["Aluno cancela com menos de 4h", "Vira falta — conta como aula dada, sem reposição."],
              ["Aluno quer remarcar", "Até 2 vezes por mês, com no mínimo 4h de antecedência."],
              ["Professor cancela", "Crédito automático para o aluno; não gasta a cota mensal dele."],
              ["Aula já concluída ou com falta", "Não pode ser remarcada."],
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Exceção é decisão humana",
            text: "O sistema aplica a regra automaticamente. Abrir exceção (abonar uma falta, liberar uma terceira remarcação) é decisão da coordenação — combine antes de prometer ao aluno.",
          },
        ],
      },
      {
        id: "mgr-onboarding",
        title: "Onboarding de novos alunos",
        summary: "Acompanhar quem preencheu o perfil de entrada e quem travou.",
        route: "/hub/manager/students/onboarding",
        keywords: ["onboarding", "perfil", "novo aluno", "entrada", "questionário", "funil"],
        blocks: [
          {
            type: "p",
            text: "Todo aluno novo preenche um perfil de entrada — objetivos, nível, disponibilidade e preferências. Essa informação orienta a alocação com o professor certo e o planejamento das primeiras aulas.",
          },
          {
            type: "bullets",
            items: [
              "A lista mostra o status de cada perfil; clique para ver as respostas completas.",
              "Perfis incompletos são o seu alvo de contato ativo — o aluno começou e parou.",
              "Quanto antes o perfil for concluído, melhor a alocação e menor o risco de troca de professor depois.",
            ],
          },
        ],
      },
      {
        id: "mgr-conversas",
        title: "Conversas (WhatsApp)",
        summary: "Atender alunos pelo número oficial da escola.",
        route: "/hub/manager/conversas",
        keywords: ["whatsapp", "chat", "conversa", "atendimento", "mensagem", "responder"],
        blocks: [
          {
            type: "p",
            text: "Caixa de entrada conectada ao WhatsApp da escola. As mensagens dos alunos chegam em tempo real e a resposta sai pelo número oficial.",
          },
          {
            type: "note",
            variant: "warning",
            title: "A janela de 24 horas",
            text: "Você escreve livremente enquanto estiver dentro de **24 horas** desde a última mensagem do aluno. Passado esse prazo, só é possível iniciar contato com um template aprovado — é regra da Meta, não da plataforma. Na dúvida, peça ao admin para disparar o template adequado.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "mgr-aprendizado",
    title: "Aprendizado",
    description: "Lições, itens, nivelamento e indicadores pedagógicos.",
    icon: "BookOpen",
    articles: [
      {
        id: "mgr-licoes",
        title: "Lições",
        summary: "Criar e publicar o material didático usado pelos professores.",
        route: "/hub/manager/learning/lessons",
        keywords: ["lição", "material", "conteúdo", "publicar", "didático", "criar"],
        blocks: [
          {
            type: "p",
            text: "Aqui o material didático é produzido e revisado. Uma lição só aparece na biblioteca dos professores quando está marcada como **pronta** — enquanto isso, fica visível apenas para quem está produzindo.",
          },
          {
            type: "note",
            variant: "info",
            title: "Publique só o revisado",
            text: "Professores usam esse material ao vivo, com aluno na tela. Erro em lição publicada aparece na pior hora possível — revise antes de marcar como pronta.",
          },
        ],
      },
      {
        id: "mgr-itens",
        title: "Itens de aprendizado",
        summary: "As peças que alimentam a prática diária dos alunos.",
        route: "/hub/manager/learning/learning-items",
        keywords: ["item", "exercício", "prática", "vocabulário", "atividade", "trilha"],
        blocks: [
          {
            type: "p",
            text: "Itens são as unidades usadas na prática diária adaptativa. O sistema os distribui conforme o nível do aluno e o que ele vem errando, então a qualidade e a classificação de nível de cada item impactam diretamente a experiência.",
          },
        ],
      },
      {
        id: "mgr-nivelamento",
        title: "Nivelamento",
        summary: "Gerenciar o teste que define o nível dos alunos.",
        route: "/hub/manager/learning/placement",
        keywords: ["nivelamento", "placement", "teste", "nível", "avaliação"],
        blocks: [
          {
            type: "p",
            text: "É a configuração do teste que posiciona o aluno em um nível ao entrar na escola. O resultado orienta o planejamento das aulas e serve de marco para acompanhar evolução.",
          },
          {
            type: "note",
            variant: "warning",
            text: "Alterar o teste muda a régua. Resultados antigos foram medidos pela versão anterior, então comparações entre alunos avaliados por versões diferentes exigem cuidado.",
          },
        ],
      },
      {
        id: "mgr-analytics",
        title: "Indicadores de aprendizado",
        summary: "O painel de desempenho do conteúdo — ainda não disponível.",
        route: "/hub/manager/learning/analytics",
        keywords: ["analytics", "indicadores", "métricas", "desempenho", "engajamento", "relatório", "em breve"],
        blocks: [
          {
            type: "note",
            variant: "warning",
            title: "Esta tela ainda não está pronta",
            text: "A página mostra um aviso de que o painel está em construção e não traz dados. Ela vai responder duas perguntas quando estiver pronta: qual conteúdo está sendo consumido e onde os alunos estão travando.",
          },
          {
            type: "p",
            text: "Enquanto isso, para saber onde os alunos travam, use a ficha do aluno (aba de aulas e currículo) e a tela de Itens de Aprendizado, revisando os itens que parecem mal classificados.",
          },
          {
            type: "note",
            variant: "info",
            title: "Item difícil ou item mal escrito?",
            text: "Quando o painel estiver disponível, lembre: item com taxa de erro muito acima da média geralmente não é conteúdo difícil — é enunciado confuso ou nível mal classificado. Vale revisar antes de concluir que o assunto é complicado.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "mgr-operacao",
    title: "Operação",
    description: "Tarefas da equipe e sua própria conta.",
    icon: "ClipboardList",
    articles: [
      {
        id: "mgr-tarefas",
        title: "Tarefas e projetos",
        summary: "O gestor de tarefas da equipe.",
        route: "/hub/manager/tasks",
        keywords: ["tarefa", "task", "projeto", "kanban", "equipe", "organização"],
        blocks: [
          {
            type: "p",
            text: "Organiza o trabalho da equipe em projetos com colunas de status próprias. Tarefas sem projeto ficam na caixa de entrada.",
          },
          {
            type: "bullets",
            items: [
              "Use projetos para separar frentes (atendimento, conteúdo, onboarding).",
              "Cada projeto tem seu próprio fluxo de status.",
              "Tarefas podem ser atribuídas a pessoas específicas da equipe.",
            ],
          },
        ],
      },
      {
        id: "mgr-configuracoes",
        title: "Configurações da conta",
        summary: "Senha, verificação em duas etapas e notificações.",
        route: "/hub/manager/settings",
        keywords: ["senha", "2fa", "segurança", "notificação", "conta", "configuração"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Conta", does: "Nome, e-mail, foto e idioma." },
              { name: "Segurança", does: "Troca de senha e verificação em duas etapas (2FA)." },
              { name: "Notificações", does: "Quais avisos receber e por quais canais." },
              { name: "Aparência", does: "Tema claro ou escuro." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Ative o 2FA",
            text: "Sua conta acessa dados pessoais de toda a base de alunos. A verificação em duas etapas é a proteção mais efetiva contra acesso indevido.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "mgr-problemas",
    title: "Situações Comuns",
    description: "Os atendimentos que mais aparecem.",
    icon: "LifeBuoy",
    articles: [
      {
        id: "mgr-aluno-nao-entra",
        title: "“Não consigo entrar na plataforma”",
        summary: "O roteiro para destravar o acesso de um aluno.",
        keywords: ["não entra", "acesso", "senha", "convite", "bloqueado", "login"],
        blocks: [
          {
            type: "steps",
            items: [
              "Confirme na lista se a conta está **ativa** — o filtro abre em ativos, então contas encerradas ficam escondidas.",
              "Confirme o e-mail cadastrado: é ele que identifica a conta.",
              "Oriente a usar “Esqueci minha senha” na tela de entrada.",
              "Se a pessoa nunca definiu senha, o convite expirou — peça ao admin para reenviar.",
              "Lembre de conferir a caixa de spam.",
            ],
          },
        ],
      },
      {
        id: "mgr-aluno-pagou",
        title: "“Paguei e continua em aberto”",
        summary: "O que verificar antes de escalar para o admin.",
        keywords: ["pagou", "pendente", "pix", "não baixou", "atraso", "cobrança"],
        blocks: [
          {
            type: "steps",
            items: [
              "Pergunte se o pagamento foi feito pelo PIX gerado na plataforma — outra chave não é reconhecida automaticamente.",
              "Peça alguns minutos: a baixa depende da confirmação do banco.",
              "Confira na ficha se o valor pago bate com o valor da parcela.",
              "Se pagou por fora ou já passou tempo demais, escale ao admin com data, valor e comprovante — só ele confirma pagamento manualmente.",
            ],
          },
          {
            type: "note",
            variant: "danger",
            title: "Nunca prometa a baixa",
            text: "Confirmação manual é do admin e exige senha. Prometer ao aluno que “já vai constar” cria expectativa que você não controla — diga que vai encaminhar e retornar.",
          },
        ],
      },
      {
        id: "mgr-quer-cancelar",
        title: "“Quero cancelar minha matrícula”",
        summary: "Como conduzir sem prometer o que não pode.",
        keywords: ["cancelar", "matrícula", "trancar", "desistir", "multa", "taxa"],
        blocks: [
          {
            type: "bullets",
            items: [
              "Entenda o motivo primeiro — boa parte dos pedidos é horário ruim ou desencontro com o professor, e tem solução sem cancelar.",
              "Encerramento no meio do contrato gera **taxa de cancelamento** de 50% de uma mensalidade.",
              "Estando na última parcela do contrato, não há taxa.",
              "Sem contrato assinado, o encerramento é imediato e sem cobrança.",
              "A execução é sempre do admin: exige senha e cancela aulas futuras de verdade.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Confirme os valores antes de falar",
            text: "Consulte a ficha do aluno para ver o estágio do contrato antes de mencionar qualquer valor. Informar taxa errada gera atrito difícil de desfazer.",
          },
        ],
      },
      {
        id: "mgr-professor-faltou",
        title: "“O professor não apareceu”",
        summary: "Como agir quando a aula não aconteceu por ausência do professor.",
        keywords: ["professor faltou", "não apareceu", "ausência", "crédito", "reposição"],
        blocks: [
          {
            type: "steps",
            items: [
              "Confirme com o professor o que aconteceu — pode ter havido problema técnico dos dois lados.",
              "Confirmada a ausência, a aula deve ficar registrada como cancelada pelo professor.",
              "Isso gera automaticamente o crédito de reposição para o aluno.",
              "Ajude o aluno a agendar a reposição em um horário livre do professor.",
              "Sendo recorrente com o mesmo professor, comunique a coordenação.",
            ],
          },
        ],
      },
    ],
  },
];
