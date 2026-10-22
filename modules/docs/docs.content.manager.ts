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
            text: "O manager cuida do aprendizado: lições, itens, nivelamento, planos de estudo, cursos e aulas de recesso. Seu acesso é focado no pedagógico; atendimento, usuários e financeiro ficam com o admin.",
          },
          {
            type: "fields",
            title: "Você pode",
            items: [
              { name: "Material didático", does: "Criar, editar e publicar lições, itens de aprendizado e testes de nivelamento." },
              { name: "Planos de estudo", does: "Montar a sequência de lições dos templates e visualizar as lições prontas." },
              { name: "Cursos", does: "Criar cursos em vídeo, organizar seções e lições e publicar." },
              { name: "Aulas de recesso", does: "Montar os pacotes de aulas gravadas do recesso." },
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
              { name: "Aprendizado", does: "Material didático: lições, itens, nivelamento e indicadores." },
              { name: "Cursos", does: "Cursos em vídeo: catálogo, seções, lições e publicação." },
              { name: "Aulas de Recesso", does: "Pacotes de aulas gravadas do recesso." },
              { name: "Meu Aprendizado", does: "Cursos de formação em que você está matriculado." },
              { name: "Tarefas", does: "Gestor de tarefas e projetos da equipe." },
              { name: "Configurações", does: "Senha, notificações e preferências." },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
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
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "cursos",
    title: "Cursos",
    description: "Catálogo, estrutura de seções e lições, publicação.",
    icon: "GraduationCap",
    articles: [
      {
        id: "cursos-catalogo",
        title: "Catálogo de cursos",
        summary: "Criar cursos, filtrar por idioma e controlar o que está publicado.",
        route: "/hub/manager/courses",
        keywords: ["curso", "catálogo", "publicar", "idioma", "criar", "excluir"],
        blocks: [
          {
            type: "p",
            text: "Lista todos os cursos da plataforma. Os filtros permitem separar por idioma e por situação (publicado ou rascunho).",
          },
          {
            type: "actions",
            items: [
              {
                label: "Criar curso",
                does: "Abre o formulário com título, descrição, idioma e imagem de capa.",
                flow: "O curso nasce como rascunho — invisível para os alunos até você publicar.",
              },
              {
                label: "Menu (⋮) › Editar",
                does: "Ajusta os dados do curso e a capa.",
              },
              {
                label: "Menu (⋮) › Publicar / Despublicar",
                does: "Controla a visibilidade do curso para os alunos.",
                flow: "Despublicar esconde o curso da vitrine, mas mantém o progresso de quem já estava fazendo.",
              },
              {
                label: "Menu (⋮) › Excluir",
                does: "Remove o curso e todo o seu conteúdo.",
                warning: "Ação destrutiva: seções, lições e o progresso dos alunos vão junto. Se a intenção é apenas tirar do ar, use despublicar.",
              },
            ],
          },
        ],
      },
      {
        id: "cursos-conteudo",
        title: "Seções e lições",
        summary: "Como o conteúdo do curso é montado e editado.",
        route: "/hub/manager/courses",
        keywords: ["lição", "seção", "módulo", "aula", "vídeo", "quiz", "editor"],
        blocks: [
          {
            type: "p",
            text: "Dentro de um curso o conteúdo é organizado em **seções** (módulos), e cada seção contém **lições**. A ordem em que aparecem é a ordem em que o aluno percorre.",
          },
          {
            type: "steps",
            title: "Montando um curso do zero",
            items: [
              "Crie o curso no catálogo — ele nasce como rascunho.",
              "Abra o curso e adicione as seções, na sequência pedagógica desejada.",
              "Dentro de cada seção, adicione as lições.",
              "Abra cada lição no editor para montar o conteúdo (texto, vídeo, exercícios).",
              "Revise a ordem e publique o curso para liberar aos alunos.",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Publique só quando estiver pronto",
            text: "Alunos com o curso em andamento veem as alterações imediatamente. Reordenar ou remover lições de um curso já publicado pode confundir quem está no meio da trilha.",
          },
        ],
      },
    ],
  },

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

];
