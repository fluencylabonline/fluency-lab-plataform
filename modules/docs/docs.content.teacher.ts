import type { DocSection } from "./docs.types";

/** Central de Ajuda do Professor. */
export const TEACHER_DOCS: DocSection[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-inicio",
    title: "Começando",
    description: "Primeiro acesso e o mapa das suas áreas.",
    icon: "Compass",
    articles: [
      {
        id: "prof-primeiro-acesso",
        title: "Primeiro acesso",
        summary: "Como entrar e o que configurar antes da primeira aula.",
        keywords: ["entrar", "login", "senha", "convite", "início", "começar"],
        blocks: [
          {
            type: "steps",
            items: [
              "Você recebe um convite por e-mail e WhatsApp quando seu cadastro é criado.",
              "Clique no link e defina sua senha — a escola não tem acesso a ela.",
              "Assine seu contrato na área de Contrato, se ainda não tiver assinado.",
              "Cadastre sua disponibilidade na Agenda: sem isso, nenhum aluno pode ser alocado com você.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Disponibilidade vem antes de tudo",
            text: "Sua agenda de horários livres é o que permite alocar e remarcar alunos. Enquanto ela estiver vazia, você não aparece como opção nas telas de agendamento.",
          },
        ],
      },
      {
        id: "prof-visao-geral",
        title: "O que tem em cada área",
        summary: "Um mapa rápido do seu menu.",
        keywords: ["menu", "áreas", "navegação", "onde fica", "mapa"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Meu Perfil", does: "Seus dados, foto e informações de contato." },
              { name: "Alunos", does: "Os alunos vinculados a você, com histórico e progresso de cada um." },
              { name: "Minha Agenda", does: "Suas aulas, sua disponibilidade e o registro do que aconteceu em cada encontro." },
              { name: "Lições", does: "A biblioteca de material didático pronto para usar nas aulas." },
              { name: "Meu Aprendizado", does: "Cursos de formação em que você está matriculado." },
              { name: "Configurações", does: "Senha, notificações e preferências." },
            ],
          },
          {
            type: "p",
            text: "Há também a **Biblioteca de Recesso**, acessível pela Agenda, onde você comunica períodos de ausência e deixa atividades para os alunos.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-agenda",
    title: "Agenda e Aulas",
    description: "Disponibilidade, registro de aulas e cancelamentos.",
    icon: "CalendarDays",
    articles: [
      {
        id: "prof-disponibilidade",
        title: "Cadastrar disponibilidade",
        summary: "Como abrir horários para que alunos possam ser agendados.",
        route: "/hub/teacher/schedule",
        keywords: ["disponibilidade", "horário", "agenda", "livre", "abrir horário", "recorrência"],
        blocks: [
          {
            type: "p",
            text: "Na Agenda você marca os horários em que está disponível. Esses horários viram os espaços que a secretaria usa para alocar alunos fixos e que os alunos veem ao remarcar uma aula.",
          },
          {
            type: "bullets",
            items: [
              "A disponibilidade é **recorrente**: você define o horário semanal e o sistema o replica nos próximos meses automaticamente.",
              "Horários já ocupados por um aluno fixo não aparecem como livres para ninguém.",
              "Ao remover uma disponibilidade, as aulas já agendadas naquele horário **não** somem — precisam ser tratadas uma a uma.",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Mudança permanente de horário",
            text: "Para mudar o horário fixo de um aluno em definitivo, fale com a secretaria. Alterar só a disponibilidade não move a aula recorrente que já existe.",
          },
        ],
      },
      {
        id: "prof-registrar-aula",
        title: "Registrar o que aconteceu na aula",
        summary: "Os três status que você pode marcar e o que cada um significa.",
        route: "/hub/teacher/schedule",
        keywords: ["status", "concluída", "falta", "no-show", "registrar", "presença", "cancelar"],
        blocks: [
          {
            type: "p",
            text: "Depois de cada encontro você registra o que aconteceu. Esse registro alimenta a frequência do aluno e o cálculo dos seus ganhos, então precisa refletir a realidade.",
          },
          {
            type: "actions",
            title: "Status que você pode marcar",
            items: [
              {
                label: "Concluída",
                does: "A aula aconteceu normalmente.",
                flow: "Conta como aula dada e entra no seu fechamento de pagamento pelo valor/hora vigente.",
              },
              {
                label: "Falta do aluno",
                does: "O aluno não apareceu e não avisou no prazo.",
                flow: "Conta como aula dada — você recebe por ela — e o aluno não tem direito a reposição.",
              },
              {
                label: "Cancelada por mim",
                does: "Você precisou cancelar a aula.",
                flow: "Gera automaticamente um crédito de reposição para o aluno, que ele usa para remarcar sem gastar a cota mensal dele.",
                warning: "Não conta como aula dada — não entra no seu pagamento.",
              },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Registre no dia",
            text: "Aulas sem registro entram como pendentes e depois são marcadas automaticamente como atrasadas pelo sistema, o que atrapalha seu fechamento. Registrar logo após a aula evita retrabalho no fim do mês.",
          },
        ],
      },
      {
        id: "prof-cancelar",
        title: "Cancelar uma aula sua",
        summary: "O que acontece com o aluno quando você precisa cancelar.",
        route: "/hub/teacher/schedule",
        keywords: ["cancelar", "desmarcar", "imprevisto", "crédito", "reposição"],
        blocks: [
          {
            type: "steps",
            items: [
              "Abra a aula na sua agenda e escolha cancelar.",
              "O aluno é avisado automaticamente por e-mail e notificação.",
              "Um crédito de reposição é gerado na conta dele.",
              "O aluno usa esse crédito para escolher um novo horário entre os seus livres.",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Avise com o máximo de antecedência",
            text: "O crédito é gerado de qualquer forma, mas quanto antes o aluno souber, maior a chance de ele conseguir um horário bom para repor. Um recado no WhatsApp junto do cancelamento faz diferença.",
          },
        ],
      },
      {
        id: "prof-recesso",
        title: "Recesso e ausências programadas",
        summary: "Como comunicar férias e deixar atividades para os alunos.",
        route: "/hub/teacher/recess",
        keywords: ["recesso", "férias", "ausência", "descanso", "sla", "30 dias", "15 dias", "atividade"],
        blocks: [
          {
            type: "p",
            text: "Recesso é a ausência planejada — férias, viagem, compromisso pessoal. Diferente de um cancelamento avulso, ele cobre um período inteiro e é comunicado com antecedência.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Avise com 30 dias de antecedência e no máximo 15 dias seguidos",
            text: "O recesso só pode ser marcado com pelo menos **30 dias corridos** de antecedência (contando fins de semana) e não pode durar mais que **15 dias corridos**. Fora dessas regras o sistema bloqueia o agendamento — não existe mais análise manual de exceção.",
          },
          {
            type: "p",
            text: "Antes de confirmar, é preciso selecionar uma atividade de recesso para cada aula afetada — o sistema não deixa concluir o agendamento sem isso. A atividade não precisa ser sua: você pode usar qualquer lição já existente na **Biblioteca de Recesso**, criada por você ou por outro professor.",
          },
          {
            type: "p",
            text: "Alunos afetados e a coordenação são sempre avisados assim que o recesso é confirmado, para que a equipe possa providenciar outro professor se for o caso.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-alunos",
    title: "Alunos",
    description: "Acompanhar quem é seu aluno, o histórico e o caderno.",
    icon: "Users",
    articles: [
      {
        id: "prof-lista-alunos",
        title: "Seus alunos",
        summary: "Quem está vinculado a você e como acompanhar cada um.",
        route: "/hub/teacher/students",
        keywords: ["alunos", "lista", "meus alunos", "turma", "acompanhar"],
        blocks: [
          {
            type: "p",
            text: "Lista os alunos com aula agendada com você. Clique em um nome para abrir a ficha dele: histórico de aulas, caderno, progresso na trilha e nível de nivelamento.",
          },
          {
            type: "note",
            variant: "info",
            title: "Você vê só os seus",
            text: "Por proteção de dados, sua visão é limitada aos alunos vinculados a você — e a dados pedagógicos. Informações financeiras e documentos pessoais ficam restritos à administração.",
          },
        ],
      },
      {
        id: "prof-caderno",
        title: "Caderno da aula",
        summary: "Registrar o que foi trabalhado para o aluno revisar depois.",
        keywords: ["caderno", "anotações", "registro", "conteúdo", "material", "notas"],
        blocks: [
          {
            type: "p",
            text: "Cada aula tem uma página de caderno onde você registra o que foi trabalhado, exemplos e observações. O aluno acessa esse conteúdo a qualquer momento na área de Caderno dele.",
          },
          {
            type: "bullets",
            items: [
              "Escreva pensando em quem vai reler dias depois, sem o contexto da conversa.",
              "Anexos (imagens, arquivos) têm prazo de validade e são removidos automaticamente — o texto permanece.",
              "É a principal ferramenta de continuidade entre uma aula e a seguinte.",
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-material",
    title: "Material Didático",
    description: "Lições prontas e cursos de formação.",
    icon: "BookOpen",
    articles: [
      {
        id: "prof-licoes",
        title: "Biblioteca de lições",
        summary: "Material pronto para usar durante as aulas.",
        route: "/hub/teacher/lessons",
        keywords: ["lição", "material", "biblioteca", "conteúdo", "atividade", "aula pronta"],
        blocks: [
          {
            type: "p",
            text: "Reúne o material didático já produzido e revisado, filtrável por idioma e nível. Abra uma lição para usar durante a aula ou como base do seu planejamento.",
          },
          {
            type: "note",
            variant: "info",
            text: "Só aparecem lições com status pronto. Material em produção fica visível apenas para quem está montando o conteúdo.",
          },
        ],
      },
      {
        id: "prof-meu-aprendizado",
        title: "Meu Aprendizado",
        summary: "Os cursos de formação em que você está matriculado.",
        route: "/hub/teacher/my-courses",
        keywords: ["formação", "treinamento", "curso", "capacitação", "aprendizado"],
        blocks: [
          {
            type: "p",
            text: "Cursos de formação e capacitação disponibilizados pela escola. Funcionam igual aos cursos dos alunos: seções, lições e progresso salvo automaticamente.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-pagamentos",
    title: "Contrato e Ganhos",
    description: "Como seu pagamento é calculado.",
    icon: "Wallet",
    articles: [
      {
        id: "prof-ganhos",
        title: "Como seus ganhos são calculados",
        summary: "A relação entre registro de aula e fechamento do mês.",
        keywords: ["pagamento", "ganhos", "valor hora", "receber", "fechamento", "repasse"],
        blocks: [
          {
            type: "p",
            text: "Seu pagamento é calculado sobre as aulas efetivamente registradas no período, multiplicadas pelo seu valor/hora vigente no momento de cada aula.",
          },
          {
            type: "table",
            headers: ["Registro da aula", "Entra no pagamento?"],
            rows: [
              ["Concluída", "Sim."],
              ["Falta do aluno", "Sim — o aluno não avisou no prazo, seu tempo foi reservado."],
              ["Cancelada por você", "Não."],
              ["Cancelada pelo aluno no prazo", "Não."],
              ["Sem registro", "Não, até que você registre."],
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Registro atrasado, pagamento atrasado",
            text: "O fechamento usa o que está registrado na data de apuração. Aulas registradas depois do fechamento entram só no mês seguinte.",
          },
        ],
      },
      {
        id: "prof-contrato",
        title: "Seu contrato",
        summary: "Onde ler, assinar e baixar seu contrato.",
        route: "/hub/teacher/contract",
        keywords: ["contrato", "assinar", "pdf", "documento", "vigência"],
        blocks: [
          {
            type: "p",
            text: "Aqui você lê e assina digitalmente seu contrato de prestação de serviços, e baixa o PDF depois de assinado. O contrato tem prazo de vigência e é renovado periodicamente — você é avisado quando a renovação se aproxima.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "prof-problemas",
    title: "Problemas Comuns",
    description: "O que fazer quando algo não funciona.",
    icon: "LifeBuoy",
    articles: [
      {
        id: "prof-aluno-nao-aparece",
        title: "O aluno não apareceu na aula",
        summary: "Quanto esperar e como registrar.",
        keywords: ["não apareceu", "falta", "no-show", "atrasado", "esperar"],
        blocks: [
          {
            type: "steps",
            items: [
              "Aguarde na sala pelo tempo de tolerância combinado com a coordenação.",
              "Tente contato pelo WhatsApp da escola durante a espera.",
              "Não aparecendo, registre a aula como **falta do aluno**.",
              "Se houver um motivo sério, comunique a secretaria — a decisão sobre abonar é dela.",
            ],
          },
          {
            type: "note",
            variant: "info",
            text: "Registrar falta é o correto e não é punição: garante que seu tempo reservado seja remunerado e mantém a frequência do aluno fiel à realidade.",
          },
        ],
      },
      {
        id: "prof-videochamada",
        title: "Problemas na videochamada",
        summary: "Câmera, microfone e instabilidade de conexão.",
        keywords: ["câmera", "microfone", "áudio", "vídeo", "chamada", "travando", "conexão"],
        blocks: [
          {
            type: "steps",
            items: [
              "Autorize câmera e microfone no navegador.",
              "Feche outros aplicativos que usam a câmera (Zoom, Meet, Teams).",
              "Prefira Chrome — é o navegador mais estável para a chamada.",
              "Com internet instável, desligue seu vídeo e siga só com áudio.",
            ],
          },
        ],
      },
      {
        id: "prof-agenda-errada",
        title: "Minha agenda está errada",
        summary: "Horário fora do lugar ou aula que não deveria existir.",
        keywords: ["agenda errada", "horário errado", "fuso", "aula duplicada", "sumiu"],
        blocks: [
          {
            type: "bullets",
            items: [
              "Confira o fuso horário do seu dispositivo — a agenda segue o horário do aparelho.",
              "Aulas recorrentes são geradas com meses de antecedência: alterar a disponibilidade não remove as que já existem.",
              "Aula duplicada ou em horário que você não abriu deve ser reportada à secretaria, que ajusta a recorrência.",
            ],
          },
        ],
      },
    ],
  },
];
