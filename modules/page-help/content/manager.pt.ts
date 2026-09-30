import type { ManagerHelpRoute, RoleHelpContent } from "../page-help.types";

/**
 * Ajuda das páginas do manager — português.
 *
 * O manager tem acesso amplo no pedagógico e no atendimento, e propositalmente
 * limitado no financeiro e no cadastro. Onde a tela esconde algo por causa
 * disso, o texto diz por quê e para quem encaminhar.
 * Ver `.agents/rules/page-help.md`.
 */
export const MANAGER_HELP_PT: RoleHelpContent<ManagerHelpRoute> = {
  "/hub/manager/profile": {
    title: "Meu Perfil",
    summary: "Seus dados de cadastro e o mapa das áreas que você atende.",
    docsArticleId: "mgr-papel",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Seus dados de cadastro e preferências. É a tela que abre quando você entra na plataforma.",
      },
      {
        heading: "O que você pode fazer",
        body: [
          "Suporte a alunos: abrir a ficha de qualquer aluno, ver histórico e resolver pendências do dia a dia.",
          "Suporte a professores: acompanhar agendas e ajudar em ajustes de aula.",
          "Créditos: conceder créditos de reposição quando a situação justificar.",
          "Material didático: criar, editar e publicar lições, itens de aprendizado e o teste de nivelamento.",
          "Aulas: ajustar o status de qualquer aula quando o professor não conseguir.",
          "Conversas: atender alunos pelo WhatsApp da escola.",
        ],
      },
      {
        heading: "O que fica com o admin",
        body: [
          "Criar e desativar usuários.",
          "Financeiro completo: transações, impostos, planos e confirmação de pagamento.",
          "Contratos: modelos e dados jurídicos da escola.",
          "Revelar dados sensíveis: CPF, telefone e endereço.",
        ],
      },
      {
        heading: "Precisou de algo fora do seu alcance?",
        body: "Não é falta de confiança — é separação de responsabilidade. Essas ações exigem confirmação de senha e ficam registradas em auditoria. Encaminhe ao admin.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua página inicial",
        text: "Aqui ficam seus dados. O trabalho do dia a dia acontece em Usuários, Conversas e Aprendizado.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Por onde circular",
        text: "Usuários (fichas e suporte), Conversas (WhatsApp da escola), Aprendizado (material didático), Tarefas, Meu Aprendizado e Configurações.",
      },
      {
        id: "limits",
        title: "O que fica com o admin",
        text: "Criar e desativar usuários, financeiro completo, contratos e revelar CPF, telefone ou endereço. São ações que exigem senha e ficam em auditoria — encaminhe ao admin em vez de prometer ao aluno.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "Este botão em toda página",
        text: "O (?) explica a tela em que você está. Para os guias completos e os roteiros de atendimento, use a Central de Ajuda no menu.",
      },
    ],
  },

  "/hub/manager/users": {
    title: "Usuários",
    summary:
      "A busca e a ficha de alunos e professores — o ponto de partida de quase todo atendimento.",
    docsArticleId: "mgr-ficha-aluno",
    sections: [
      {
        heading: "A busca",
        body: "A busca do topo encontra por nome, e-mail ou telefone. Clique num cartão para abrir a ficha completa da pessoa.",
      },
      {
        heading: "Os quatro filtros",
        body: [
          "Cargo: Todos os Cargos, Administrador, Professor, Aluno ou Gerente. Abre em Aluno.",
          "Status: Todos, Ativos ou Inativos. Abre em Ativos — por isso uma conta encerrada não aparece até você trocar para Todos ou Inativos.",
          "Contrato: Todos contratos, Ativo ou Sem Contrato. Útil para achar quem ainda não assinou.",
          "Pagamento: Todos pagamentos, Pagos ou Pendentes. Útil para a régua de cobrança.",
        ],
      },
      {
        heading: "Quando alguém diz que não consegue entrar",
        body: "O primeiro passo é quase sempre o filtro de Status: ele abre em Ativos, então uma conta desativada some da lista e parece não existir. Troque para Inativos antes de concluir qualquer coisa.",
      },
      {
        heading: "Perfil Adaptativo",
        body: "O botão à direita dos filtros leva ao onboarding: a lista dos perfis de entrada dos alunos novos, com quem já respondeu e quem travou no meio.",
      },
      {
        heading: "Campos mascarados",
        body: "CPF, telefone completo e endereço aparecem ocultos, e só o admin consegue revelá-los. Se o atendimento exigir confirmar um documento, encaminhe.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O ponto de partida do atendimento",
        text: "Quase todo atendimento começa aqui: achar a pessoa e abrir a ficha dela.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "A busca",
        text: "Encontra por nome, e-mail ou telefone. É o caminho mais rápido quando o aluno já se identificou.",
      },
      {
        id: "filters",
        target: "users.filters",
        title: "Os quatro filtros",
        text: "Cargo (abre em Aluno), Status (abre em Ativos), Contrato (Ativo ou Sem Contrato) e Pagamento (Pagos ou Pendentes). Combinando Contrato com Pagamento você monta a lista de pendências do dia.",
      },
      {
        id: "status-trap",
        target: "users.filters",
        title: "A pegadinha do Status",
        text: "Ele abre em Ativos. Aluno que diz não conseguir entrar e some da busca pode estar simplesmente desativado — troque para Inativos antes de concluir qualquer coisa.",
      },
      {
        id: "list",
        target: "users.list",
        title: "A lista",
        text: "Um cartão por pessoa, com situação de contrato e de pagamento à vista. Clique para abrir a ficha completa.",
      },
      {
        id: "onboarding",
        target: "users.onboarding",
        title: "Perfil Adaptativo",
        text: "Leva à lista dos perfis de entrada dos alunos novos. Perfil incompleto é alvo de contato ativo: quanto antes for concluído, melhor a alocação com o professor certo.",
      },
    ],
  },

  "/hub/manager/users/[userId]": {
    title: "Ficha do usuário",
    summary:
      "O quadro completo de uma pessoa: dados, pagamentos, contrato, aulas e currículo.",
    docsArticleId: "mgr-ficha-aluno",
    sections: [
      {
        heading: "As abas mudam conforme o cargo",
        body: [
          "Perfil aparece sempre: dados de contato e informações de cadastro.",
          "Para aluno: Pagamento, Contrato e Plano, Aulas e Currículo, e Certificado.",
          "Para professor: Extrato de Ganhos, Contratos, Agenda e Alunos.",
        ],
      },
      {
        heading: "O que você resolve daqui",
        body: [
          "Conceder crédito de reposição pela aba de aulas e currículo.",
          "Ajustar o status de uma aula quando o professor não conseguir.",
          "Conferir a situação de contrato e de pagamento antes de responder ao aluno.",
        ],
      },
      {
        heading: "Os tipos de crédito",
        body: [
          "Cancelamento do professor: gerado automaticamente. Você não precisa fazer nada.",
          "Atraso da escola: quando houve falha do nosso lado que prejudicou a aula.",
          "Bônus: cortesia ou compensação combinada. Use com critério e registre o motivo no atendimento.",
        ],
      },
      {
        heading: "Duas armadilhas dos créditos",
        body: "Todo crédito tem validade: defina uma realista e avise o aluno, porque crédito vencido some e vira reclamação. E se o aluno agendar a reposição com crédito e depois cancelar essa aula, o crédito é consumido do mesmo jeito — deixe isso claro antes de ele confirmar o horário.",
      },
      {
        heading: "O que você não vê nem faz aqui",
        body: "CPF, telefone completo e endereço ficam mascarados. Desativar a conta, confirmar pagamento manualmente e executar cancelamento de matrícula são ações do admin, com senha e auditoria.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A ficha completa",
        text: "Tudo sobre uma pessoa em abas. Quais abas aparecem depende do cargo dela.",
      },
      {
        id: "tabs",
        target: "user-details.tabs",
        title: "As abas",
        text: "Perfil aparece sempre. Aluno tem Pagamento, Contrato e Plano, Aulas e Currículo e Certificado. Professor tem Extrato de Ganhos, Contratos, Agenda e Alunos.",
      },
      {
        id: "credits",
        target: "user-details.tabs",
        title: "Conceder crédito",
        text: "Pela aba de aulas e currículo. Escolha o tipo certo: cancelamento do professor já é automático; atraso da escola é para falha nossa; bônus é cortesia, e merece o motivo registrado.",
      },
      {
        id: "credit-traps",
        title: "Duas armadilhas dos créditos",
        text: "Crédito tem validade e some quando vence — defina uma realista e avise o aluno. E reposição agendada com crédito que o aluno depois cancela consome o crédito assim mesmo. Diga isso antes de ele confirmar.",
      },
      {
        id: "masked",
        title: "O que fica com o admin",
        text: "CPF, telefone completo e endereço aparecem mascarados. Desativar conta, confirmar pagamento na mão e executar cancelamento de matrícula também são dele. Encaminhe em vez de prometer.",
      },
    ],
  },

  "/hub/manager/students/onboarding": {
    title: "Perfis Adaptativos",
    summary:
      "Os perfis de entrada dos alunos novos: quem respondeu, quem travou e o que cada um respondeu.",
    docsArticleId: "mgr-onboarding",
    sections: [
      {
        heading: "Por que isto importa",
        body: "Todo aluno novo preenche um perfil de entrada — objetivos, nível, disponibilidade e preferências. É essa informação que orienta a alocação com o professor certo e o planejamento das primeiras aulas.",
      },
      {
        heading: "O que a lista mostra",
        body: "Um item por aluno, com a situação do perfil. Perfis incompletos são o seu alvo de contato ativo: o aluno começou e parou.",
      },
      {
        heading: "Novo Perfil",
        body: "O botão do topo cria um perfil do zero — útil quando o aluno foi matriculado sem passar pelo questionário, ou quando o perfil precisa ser refeito.",
      },
      {
        heading: "O menu de cada item",
        body: [
          "Ver abre o diagnóstico pedagógico gerado a partir das respostas.",
          "Editar abre o questionário para completar ou corrigir junto com o aluno.",
          "Excluir remove o perfil.",
        ],
      },
      {
        heading: "Quanto antes, melhor",
        body: "Perfil concluído cedo significa alocação melhor e menos risco de troca de professor depois — que é caro para o aluno e para a escola.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O onboarding dos alunos novos",
        text: "Todo aluno novo preenche um perfil de entrada. É ele que orienta a alocação com o professor certo.",
      },
      {
        id: "list",
        target: "manager-onboarding.list",
        title: "A lista",
        text: "Um item por aluno, com a situação do perfil. Os incompletos são o seu alvo de contato ativo: o aluno começou e parou no meio.",
      },
      {
        id: "new",
        target: "manager-onboarding.new",
        title: "Novo Perfil",
        text: "Cria um perfil do zero. Útil quando o aluno foi matriculado sem passar pelo questionário, ou quando o perfil precisa ser refeito.",
      },
      {
        id: "actions",
        target: "manager-onboarding.list",
        title: "O menu de cada item",
        text: "Ver abre o diagnóstico pedagógico gerado a partir das respostas. Editar abre o questionário, para completar junto com o aluno. Excluir remove o perfil.",
      },
      {
        id: "why",
        title: "Por que correr atrás",
        text: "Perfil concluído cedo significa alocação melhor e menos troca de professor depois — que é o tipo de atrito que custa caro para todo mundo.",
      },
    ],
  },

  "/hub/manager/students/onboarding/[profileId]": {
    title: "Questionário do aluno",
    summary:
      "O perfil de entrada do aluno, para preencher ou corrigir junto com ele.",
    docsArticleId: "mgr-onboarding",
    sections: [
      {
        heading: "O que é este formulário",
        body: "O questionário de entrada que o aluno responde na matrícula: objetivo com o idioma, experiência anterior, disponibilidade, nível que ele atribui a si mesmo e o quanto pretende se dedicar.",
      },
      {
        heading: "Quando você preenche por ele",
        body: "Quando o aluno travou no meio e não retoma sozinho. Preencher no atendimento, com ele na linha, costuma ser mais rápido do que insistir por mensagem.",
      },
      {
        heading: "Responda como o aluno responderia",
        body: "As respostas alimentam o diagnóstico pedagógico e a alocação. Chutar um nível ou um objetivo para destravar o cadastro estraga justamente o que o formulário serve para produzir.",
      },
      {
        heading: "Depois de concluir",
        body: "Com o perfil completo, a coordenação gera o diagnóstico pedagógico e, a partir dele, o plano de estudos.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O perfil de entrada",
        text: "O questionário que o aluno responde na matrícula. Você pode preencher ou corrigir junto com ele.",
      },
      {
        id: "form",
        target: "manager-onboarding.form",
        title: "As perguntas",
        text: "Objetivo com o idioma, experiência anterior, disponibilidade, nível que ele se atribui e o quanto pretende se dedicar. Avance pelos passos até o fim.",
      },
      {
        id: "honesty",
        title: "Responda como o aluno responderia",
        text: "As respostas alimentam o diagnóstico e a alocação. Chutar nível ou objetivo só para destravar o cadastro estraga justamente o que este formulário serve para produzir.",
      },
    ],
  },

  "/hub/manager/students/onboarding/[profileId]/view": {
    title: "Diagnóstico Pedagógico",
    summary:
      "O relatório gerado por IA a partir do perfil do aluno, e o ponto de onde sai o plano de estudos.",
    docsArticleId: "mgr-onboarding",
    sections: [
      {
        heading: "O que é o relatório",
        body: "Uma leitura pedagógica do aluno feita por IA, cruzando as respostas do questionário com o resultado do nivelamento: objetivo, contexto, pontos de atenção e sugestões de caminho.",
      },
      {
        heading: "Dados Estruturais",
        body: [
          "Nível Percebido é o nível que o próprio aluno se atribuiu — pode não bater com o nivelamento, e a diferença já é informação.",
          "Comprometimento é o quanto ele declarou que pretende se dedicar, de 0 a 10.",
        ],
      },
      {
        heading: "Geração de Plano",
        body: "A partir do diagnóstico, esta tela gera o plano de estudos do aluno. A chave IA Criativa permite que a IA sugira temas quando não encontra material equivalente no banco — ligue quando o perfil é fora do comum, deixe desligada quando você quer o plano preso ao material já revisado.",
      },
      {
        heading: "Relatório vazio?",
        body: "Se aparecer aguardando geração do diagnóstico, ele ainda não foi gerado. O questionário pode estar respondido sem que o relatório exista.",
      },
      {
        heading: "Quem mais lê isto",
        body: "O professor do aluno vê este mesmo relatório, em modo de leitura. Vale conferir se ele está coerente antes de considerar o onboarding concluído.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O diagnóstico do aluno",
        text: "Um relatório pedagógico gerado por IA a partir do questionário de entrada e do nivelamento. É daqui que sai o plano de estudos.",
      },
      {
        id: "report",
        target: "teacher-student-profile.report",
        title: "Relatório Pedagógico",
        text: "A leitura do aluno feita pela IA: objetivo, contexto, pontos de atenção e sugestões. No pé ficam a referência e a data da última atualização.",
      },
      {
        id: "metrics",
        target: "teacher-student-profile.metrics",
        title: "Dados Estruturais",
        text: "Nível Percebido é o que o aluno se atribuiu, e pode não bater com o nivelamento — a diferença já é informação. Comprometimento é quanto ele declarou pretender se dedicar, de 0 a 10.",
      },
      {
        id: "plan",
        target: "manager-diagnosis.plan",
        title: "Geração de Plano",
        text: "Gera o plano de estudos a partir do diagnóstico. A chave IA Criativa deixa a IA sugerir temas quando falta material equivalente no banco: ligue para perfis fora do comum, deixe desligada quando quiser o plano preso ao material já revisado.",
      },
      {
        id: "audience",
        title: "O professor lê isto também",
        text: "Ele vê o mesmo relatório, em modo de leitura. Confira se está coerente antes de considerar o onboarding concluído.",
      },
    ],
  },

  "/hub/manager/conversas": {
    title: "Conversas",
    summary:
      "A caixa de entrada do WhatsApp oficial da escola, com respostas rápidas e templates.",
    docsArticleId: "mgr-conversas",
    sections: [
      {
        heading: "Como funciona",
        body: "As mensagens dos alunos chegam aqui em tempo real, e a sua resposta sai pelo número oficial da escola. A lista da esquerda são as conversas; a busca no topo dela procura por conversa ou por atalho.",
      },
      {
        heading: "A janela de 24 horas",
        body: "Você escreve livremente enquanto estiver dentro de 24 horas desde a última mensagem do aluno. Passado esse prazo, só é possível iniciar contato com um template aprovado. É regra da Meta, não da plataforma — não adianta insistir no campo de texto.",
      },
      {
        heading: "Os botões da conversa",
        body: [
          "O + no topo da lista abre uma conversa nova por template — é o caminho para falar com quem está fora da janela de 24 horas.",
          "O clipe envia foto, áudio ou documento.",
          "Digitar / no campo de mensagem abre as respostas rápidas.",
          "Tocar no nome do contato abre os detalhes e as etiquetas dele.",
        ],
      },
      {
        heading: "Respostas rápidas",
        body: "São atalhos de texto pronto. Digite / seguido do nome do atalho, como /boasvindas. Economizam tempo e mantêm o tom da escola consistente entre as pessoas do atendimento.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O WhatsApp da escola",
        text: "As mensagens dos alunos chegam aqui, e sua resposta sai pelo número oficial da escola.",
      },
      {
        id: "list",
        target: "conversas.list",
        title: "As conversas",
        text: "A lista da esquerda, com a busca no topo — que procura tanto por conversa quanto por atalho de resposta rápida.",
      },
      {
        id: "new",
        target: "conversas.new",
        title: "Nova conversa por template",
        text: "O caminho para falar com quem está fora da janela de 24 horas. Fora dela, só template aprovado sai.",
      },
      {
        id: "window",
        title: "A janela de 24 horas",
        text: "Dentro de 24 horas desde a última mensagem do aluno você escreve livremente. Passado isso, só template aprovado — é regra da Meta, não da plataforma.",
      },
      {
        id: "quick",
        target: "conversas.composer",
        title: "Respostas rápidas",
        text: "Digite / no campo de mensagem para abrir os atalhos de texto pronto, como /boasvindas. O clipe ao lado envia foto, áudio ou documento.",
      },
    ],
  },

  "/hub/manager/tasks": {
    title: "Tarefas",
    summary:
      "O gestor de tarefas e projetos da equipe, em lista ou em quadro kanban.",
    docsArticleId: "mgr-tarefas",
    sections: [
      {
        heading: "Projetos e caixa de entrada",
        body: "O menu lateral lista os projetos. Cada projeto tem o seu próprio fluxo de colunas de status. Tarefas sem projeto ficam na caixa de entrada (Inbox).",
      },
      {
        heading: "As duas visões",
        body: [
          "Lista mostra as tarefas em sequência — bom para varrer o que está pendente.",
          "Kanban mostra as colunas de status lado a lado — bom para ver onde o trabalho está parado.",
        ],
      },
      {
        heading: "Criar uma tarefa",
        body: [
          "Título e Descrição dizem o que precisa ser feito.",
          "Projeto e Coluna definem onde ela nasce; sem projeto, ela vai para a caixa de entrada.",
          "Data de Entrega é o prazo.",
          "Responsáveis atribui a tarefa a pessoas da equipe.",
          "Tarefa Recorrente recria a tarefa automaticamente a cada ciclo — útil para rotinas como conferir perfis de onboarding incompletos.",
        ],
      },
      {
        heading: "Uma sugestão de organização",
        body: "Separe frentes em projetos distintos (atendimento, conteúdo, onboarding). Como cada projeto tem o seu fluxo de status, misturar frentes no mesmo quadro costuma deixar as colunas sem significado.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "As tarefas da equipe",
        text: "Organiza o trabalho em projetos, cada um com o seu fluxo de status.",
      },
      {
        id: "projects",
        target: "tasks.projects",
        title: "Projetos",
        text: "O menu lateral lista os projetos. Tarefa sem projeto fica na caixa de entrada. Vale separar frentes — atendimento, conteúdo, onboarding — porque cada projeto tem colunas próprias.",
      },
      {
        id: "views",
        target: "tasks.views",
        title: "Lista e Kanban",
        text: "Lista é melhor para varrer o que está pendente; Kanban, para ver onde o trabalho travou. No celular, o botão ao lado do + alterna entre as duas.",
      },
      {
        id: "new",
        target: "tasks.new",
        title: "Nova tarefa",
        text: "Título, descrição, projeto e coluna, prazo e responsáveis. A chave Tarefa Recorrente recria a tarefa a cada ciclo — boa para rotinas como conferir os perfis de onboarding incompletos.",
      },
    ],
  },

  "/hub/manager/learning": {
    title: "Central de Aprendizado",
    summary:
      "O ponto de entrada do material didático: planos de estudo, lições, itens e nivelamento.",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Os templates de plano de estudo — trilhas genéricas que podem ser reaproveitadas e personalizadas para cada aluno. Daqui você também chega às Lições, aos Itens de Aprendizado, ao Nivelamento e aos Indicadores.",
      },
      {
        heading: "Criar Plano",
        body: [
          "Nome do Plano é como ele aparece na hora de atribuir — seja específico, como Inglês para Negócios - Iniciante.",
          "Idioma define para qual língua o plano serve.",
          "Descrição é opcional e ajuda quem for reaproveitar o plano depois.",
        ],
      },
      {
        heading: "O menu de cada plano",
        body: [
          "Editar Trilha abre o editor onde você monta a sequência de lições.",
          "Atribuir Plano coloca a trilha na conta de um aluno.",
        ],
      },
      {
        heading: "Template não é plano do aluno",
        body: "O template é o molde. Atribuir cria a trilha daquele aluno a partir dele; mudanças posteriores no template não voltam para quem já recebeu.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O material didático",
        text: "Daqui saem os planos de estudo e o caminho para lições, itens de aprendizado e nivelamento.",
      },
      {
        id: "create",
        target: "manager-learning.create",
        title: "Criar Plano",
        text: "Cria um template: nome (seja específico, como Inglês para Negócios - Iniciante), idioma e uma descrição opcional que ajuda quem for reaproveitar depois.",
      },
      {
        id: "list",
        target: "manager-learning.list",
        title: "Os planos",
        text: "Cada cartão é um template. No menu dele, Editar Trilha abre o editor de sequência e Atribuir Plano coloca a trilha na conta de um aluno.",
      },
      {
        id: "template",
        title: "Template não é plano do aluno",
        text: "O template é o molde. Atribuir cria a trilha daquele aluno a partir dele — e mudar o template depois não volta para quem já recebeu.",
      },
    ],
  },

  "/hub/manager/learning/[id]": {
    title: "Editar Trilha",
    summary: "A sequência de lições de um plano de estudos, na ordem em que o aluno vai percorrer.",
    sections: [
      {
        heading: "O que você monta aqui",
        body: "As Lições na sequência: a ordem em que o aluno vai percorrer o plano. Cada item é uma lição vinda da biblioteca do currículo.",
      },
      {
        heading: "Os controles",
        body: [
          "Adicionar lição abre a busca da biblioteca, por título.",
          "A alça de arrastar em cada item reordena a sequência.",
          "A lixeira remove a lição da trilha — a lição em si continua existindo na biblioteca.",
        ],
      },
      {
        heading: "A ordem importa",
        body: "É esta sequência que o aluno vê como trilha, dia a dia. Uma lição fora de ordem aparece como pré-requisito que ainda não foi visto.",
      },
      {
        heading: "Salvar",
        body: "As alterações são gravadas no plano. Se este é um template, elas valem para as próximas atribuições, não para os alunos que já receberam a trilha.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A sequência do plano",
        text: "Aqui você define a ordem em que o aluno vai percorrer as lições.",
      },
      {
        id: "sequence",
        target: "manager-path.sequence",
        title: "Lições na sequência",
        text: "Cada item é uma lição da biblioteca. A alça de arrastar reordena, e a lixeira tira a lição da trilha sem apagá-la da biblioteca.",
      },
      {
        id: "add",
        target: "manager-path.add",
        title: "Adicionar lição",
        text: "Abre a busca da biblioteca por título. Só entram lições que já existem no currículo.",
      },
      {
        id: "order",
        title: "A ordem importa",
        text: "É esta sequência que o aluno vê dia a dia. Lição fora de ordem vira pré-requisito que ele ainda não viu.",
      },
    ],
  },

  "/hub/manager/learning/lessons": {
    title: "Lições",
    summary:
      "Onde o material didático é produzido, revisado e publicado para os professores.",
    docsArticleId: "mgr-licoes",
    sections: [
      {
        heading: "Pronta é o que importa",
        body: "Uma lição só aparece na biblioteca dos professores quando está marcada como pronta. Enquanto isso, fica visível apenas para quem está produzindo.",
      },
      {
        heading: "Criar Lição",
        body: [
          "Título da Lição é como ela aparece na biblioteca.",
          "Nível de Dificuldade define para quem ela serve.",
          "Idioma de Estudo é a língua sendo ensinada.",
          "Idioma Nativo é a língua de apoio nas explicações.",
          "Criar e Continuar abre o editor de passos.",
        ],
      },
      {
        heading: "Excluir uma lição",
        body: "A exclusão é lógica: a lição deixa de ficar disponível para planos novos, mas as atribuições que já existem continuam funcionando. Ninguém perde conteúdo no meio da trilha por causa disso.",
      },
      {
        heading: "Publique só o revisado",
        body: "Professores usam este material ao vivo, com aluno na tela. Erro em lição publicada aparece na pior hora possível.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A produção do material",
        text: "Aqui as lições são criadas, revisadas e publicadas. Só as marcadas como prontas chegam aos professores.",
      },
      {
        id: "create",
        target: "manager-lessons.create",
        title: "Criar Lição",
        text: "Título, nível de dificuldade, idioma de estudo e idioma nativo. Criar e Continuar abre o editor de passos, que leva a lição do rascunho até publicada.",
      },
      {
        id: "list",
        target: "manager-lessons.list",
        title: "As lições",
        text: "Cada cartão mostra a situação da lição. Abra uma para continuar de onde o trabalho parou.",
      },
      {
        id: "delete",
        title: "Excluir é lógico, não destrutivo",
        text: "A lição sai dos planos novos, mas as atribuições existentes seguem funcionando — ninguém fica sem conteúdo no meio da trilha.",
      },
      {
        id: "review",
        title: "Publique só o revisado",
        text: "Professor usa este material ao vivo, com aluno na tela. Erro em lição publicada aparece na pior hora possível.",
      },
    ],
  },

  "/hub/manager/learning/lessons/[lessonId]": {
    title: "Editor de Lição",
    summary:
      "O caminho de 11 passos que leva uma lição do rascunho até publicada, com apoio de IA.",
    docsArticleId: "mgr-licoes",
    sections: [
      {
        heading: "Os 11 passos",
        body: [
          "1 Setup: a configuração da lição. 2 Mídia: o upload do vídeo ou áudio. 3 Transcrição: editar o texto transcrito.",
          "4 Análise I: a IA varre a transcrição atrás de vocabulário e estruturas. 5 Editor: o conteúdo da lição em si.",
          "6 Auditoria: a revisão pedagógica. 7 Extração: os itens de aprendizado finais. 8 Revisão: a prioridade de cada item.",
          "9 Quiz: a geração do teste. 10 Edição Quiz: o ajuste manual das questões. 11 Pronta: a lição publicada.",
        ],
      },
      {
        heading: "Os passos são sequenciais",
        body: "Cada passo depende do anterior, e a tela avisa quando você tenta pular. Dá para sair no meio e voltar depois: o progresso fica salvo no rascunho.",
      },
      {
        heading: "A IA propõe, você decide",
        body: "A varredura, a extração de itens e a geração do quiz são sugestões de IA. Os passos de revisão existem justamente para você corrigir antes de publicar — item mal classificado vai direto para a prática diária dos alunos.",
      },
      {
        heading: "Só o passo 11 publica",
        body: "Até lá a lição é rascunho e não aparece para os professores. Chegar ao último passo é o que a torna utilizável em aula.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Do rascunho até publicada",
        text: "São 11 passos, do upload da mídia até a lição pronta. A IA ajuda em vários deles, mas quem aprova é você.",
      },
      {
        id: "stepper",
        target: "manager-lesson-editor.stepper",
        title: "Os passos",
        text: "Setup, Mídia, Transcrição, Análise, Editor, Auditoria, Extração, Revisão, Quiz, Edição do Quiz e Pronta. São sequenciais: a tela avisa quando falta completar um anterior.",
      },
      {
        id: "content",
        target: "manager-lesson-editor.content",
        title: "O passo atual",
        text: "O trabalho do passo em que você está. Dá para sair no meio e voltar depois — o progresso fica salvo no rascunho.",
      },
      {
        id: "ai",
        title: "A IA propõe, você decide",
        text: "Varredura, extração de itens e geração de quiz são sugestões. Os passos de revisão existem para você corrigir antes de publicar: item mal classificado cai direto na prática diária dos alunos.",
      },
      {
        id: "publish",
        title: "Só o passo 11 publica",
        text: "Até chegar em Pronta, a lição é rascunho e não aparece para os professores.",
      },
    ],
  },

  "/hub/manager/learning/learning-items": {
    title: "Itens de Aprendizado",
    summary:
      "As unidades de vocabulário e estrutura que alimentam a prática diária dos alunos.",
    docsArticleId: "mgr-itens",
    sections: [
      {
        heading: "O que é um item",
        body: "A menor unidade de conteúdo: uma palavra de vocabulário ou uma estrutura gramatical. A prática diária adaptativa distribui esses itens conforme o nível do aluno e o que ele vem errando.",
      },
      {
        heading: "Os filtros e a busca",
        body: [
          "A busca procura por palavra, frase ou tradução.",
          "O filtro de idioma abre em Todos os Idiomas.",
          "O filtro de nível abre em Todos os Níveis.",
        ],
      },
      {
        heading: "O que a ficha de um item traz",
        body: "Tradução, fonética, tipo, significados, explicação e exemplos. É o que o aluno acaba vendo na prática e no caderno.",
      },
      {
        heading: "Por que a classificação de nível importa tanto",
        body: "O nível do item decide para quem ele aparece. Item classificado abaixo do que é vira muleta fácil demais; acima, vira frustração. Qualidade e nível dos itens impactam diretamente a experiência da prática diária.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "As peças da prática diária",
        text: "Cada item é uma palavra ou uma estrutura. É isso que a prática adaptativa distribui aos alunos conforme o nível e os erros de cada um.",
      },
      {
        id: "filters",
        target: "manager-items.filters",
        title: "Busca e filtros",
        text: "A busca aceita palavra, frase ou tradução. Os filtros de idioma e de nível abrem em Todos — estreite antes de concluir que algo não existe.",
      },
      {
        id: "list",
        target: "manager-items.list",
        title: "Os itens",
        text: "Cada item aparece marcado como Vocabulário ou Estrutura. Abra um para ver tradução, fonética, significados, explicação e exemplos.",
      },
      {
        id: "level",
        title: "O nível é a parte crítica",
        text: "O nível do item decide para quem ele aparece. Abaixo do que é, vira muleta; acima, vira frustração. É o campo que mais afeta a experiência da prática diária.",
      },
    ],
  },

  "/hub/manager/learning/placement": {
    title: "Gestão de Nivelamento",
    summary:
      "O banco de questões do teste que posiciona o aluno em um nível ao entrar na escola.",
    docsArticleId: "mgr-nivelamento",
    sections: [
      {
        heading: "Para que serve o teste",
        body: "Ele posiciona o aluno em um nível na entrada. O resultado orienta o planejamento das aulas e serve de marco para acompanhar a evolução depois.",
      },
      {
        heading: "O que a tela mostra",
        body: [
          "O seletor de Idioma escolhe o banco de questões que você está vendo.",
          "Dois contadores mostram quantas Questões Ativas existem (as que entram nos testes) e quantos Rascunhos ainda não foram liberados.",
        ],
      },
      {
        heading: "Gerar Questões",
        body: "Abre o gerador: você seleciona os itens de estudo e os áudios que servirão de base, e a IA propõe questões a partir deles. Depois você revisa, edita e salva as que valem.",
      },
      {
        heading: "Alterar o teste muda a régua",
        body: "Resultados antigos foram medidos pela versão anterior do banco. Comparar alunos avaliados por versões diferentes exige cuidado — e vale registrar quando uma mudança grande entrou.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O banco do nivelamento",
        text: "As questões que posicionam o aluno em um nível quando ele entra na escola.",
      },
      {
        id: "language",
        target: "manager-placement.language",
        title: "O idioma",
        text: "Cada idioma tem o seu banco. Troque aqui antes de concluir que faltam questões.",
      },
      {
        id: "tabs",
        target: "manager-placement.stats",
        title: "Ativas e Rascunhos",
        text: "Dois contadores: Questões Ativas são as que entram nos testes de verdade; Rascunhos são as geradas ou escritas que ainda não foram liberadas. Rascunho acumulando é sinal de revisão parada.",
      },
      {
        id: "generate",
        target: "manager-placement.generate",
        title: "Gerar Questões",
        text: "Você escolhe os itens de estudo e os áudios que servem de base, e a IA propõe questões. Elas nascem como rascunho: revise e edite antes de ativar.",
      },
      {
        id: "ruler",
        title: "Mudar o teste muda a régua",
        text: "Resultados antigos foram medidos pela versão anterior. Comparar alunos avaliados por versões diferentes exige cuidado.",
      },
    ],
  },

  "/hub/manager/learning/analytics": {
    title: "Indicadores de Aprendizado",
    summary:
      "O painel de desempenho do conteúdo — ainda não disponível.",
    docsArticleId: "mgr-analytics",
    sections: [
      {
        heading: "Esta tela ainda não está pronta",
        body: "O painel aparece com o aviso de que está em construção. Ele vai mostrar progresso dos alunos, taxas de conclusão e desempenho das trilhas, mas ainda não traz dados.",
      },
      {
        heading: "Enquanto isso",
        body: "Para entender onde os alunos estão travando, o caminho hoje é a ficha do aluno (aulas e currículo) e os Itens de Aprendizado, onde dá para revisar itens que parecem mal classificados.",
      },
      {
        heading: "Quando estiver pronto",
        body: "A pergunta que ele vai responder é dupla: qual conteúdo está sendo consumido e onde os alunos estão parando. Item com taxa de erro muito acima da média costuma ser enunciado confuso ou nível mal classificado, não assunto difícil.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Ainda em construção",
        text: "Esta tela mostra um aviso de que o painel está a caminho. Ela ainda não traz dados — não é erro seu nem falha de carregamento.",
      },
      {
        id: "meanwhile",
        title: "Enquanto isso",
        text: "Para saber onde os alunos travam, use a ficha do aluno (aulas e currículo) e os Itens de Aprendizado, revisando os que parecem mal classificados.",
      },
    ],
  },

  "/hub/manager/my-courses": {
    title: "Meu Aprendizado",
    summary: "Os cursos de formação da escola em que você está matriculado.",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Cursos de formação disponibilizados pela escola para você. Funcionam igual aos cursos dos alunos: seções, lições e progresso salvo automaticamente.",
      },
      {
        heading: "Não é o material didático",
        body: "Estes cursos são para o seu desenvolvimento. O material que os professores usam em aula fica em Aprendizado, na área de Lições.",
      },
      {
        heading: "Seu progresso é salvo",
        body: "Pode parar no meio e continuar depois de onde estava, inclusive em outro aparelho.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua formação",
        text: "Os cursos que a escola disponibiliza para o seu desenvolvimento — não o material de aula, que fica em Aprendizado.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "Seus cursos",
        text: "Cada cartão é um curso liberado para você, com o progresso já feito. Toque para abrir.",
      },
      {
        id: "progress",
        title: "Pode parar no meio",
        text: "O progresso é salvo automaticamente, então dá para continuar depois, até em outro aparelho.",
      },
    ],
  },

  "/hub/manager/my-courses/[id]": {
    title: "Assistindo ao curso",
    summary: "O player do curso de formação: conteúdo, menu de lições e quizzes.",
    sections: [
      {
        heading: "Como a tela se organiza",
        body: "O conteúdo da lição fica no centro e a lista de lições no menu lateral, agrupada por seção. As concluídas aparecem marcadas. No celular, use o botão Menu para abrir e fechar a lista.",
      },
      {
        heading: "Os botões",
        body: [
          "Marcar como concluída registra a lição como feita e atualiza a barra de progresso.",
          "Anterior e Próxima andam entre as lições na ordem do curso.",
          "Menu abre a lista de lições no celular.",
        ],
      },
      {
        heading: "Quizzes",
        body: "Algumas lições terminam com um quiz. Finalizar Quiz corrige e mostra seus acertos; Praticar Novamente refaz quantas vezes você quiser, e a última tentativa fica salva.",
      },
      {
        heading: "Aqui o menu lateral não aparece",
        body: "Para você assistir sem distração, o menu da plataforma fica escondido nesta tela. Use o botão de voltar do topo para sair.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O player do curso",
        text: "Sua tela de estudo. Vamos ver o conteúdo, o menu de lições e o progresso.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "A lição",
        text: "Vídeo, texto ou os dois. Quando a lição ainda não tem conteúdo publicado, a tela avisa.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "As lições do curso",
        text: "A lista completa, por seção, com as concluídas marcadas. Toque em qualquer uma para pular direto.",
      },
      {
        id: "complete",
        target: "student-course-player.complete",
        title: "Marcar como concluída",
        text: "Registra a lição como feita e atualiza a barra de progresso. Anterior e Próxima seguem a ordem do curso.",
      },
    ],
  },

  "/hub/manager/settings": {
    panel: "wizard",
    title: "Configurações",
    summary:
      "Seus dados, idioma, tema, avisos que você recebe e a segurança da sua conta.",
    docsArticleId: "mgr-configuracoes",
    tour: [
      {
        id: "intro",
        title: "As configurações da sua conta",
        text: "Cinco abas, cada uma com um assunto. Vamos ver o que fica em cada uma.",
      },
      {
        id: "tabs",
        target: "settings.tabs",
        title: "As abas",
        text: "Conta traz seus dados, e-mail e idioma da plataforma. Aparência troca entre claro e escuro. Notificações escolhe quais avisos você recebe. Segurança cuida da senha e da verificação em duas etapas. Aplicativo instala a plataforma no seu celular.",
      },
      {
        id: "account",
        target: "settings.tabs",
        title: "Aba Conta",
        text: "Foto, nome, e-mail principal (com selo de verificado) e o idioma da interface.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Aba Notificações",
        text: "Uma chave para cada tipo de aviso. Vale manter ligadas as notificações do chat: é como você fica sabendo de mensagem nova de aluno no WhatsApp da escola.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Aba Segurança — ative o 2FA",
        text: "Sua conta acessa dados pessoais de toda a base de alunos. A verificação em duas etapas usa um app de autenticação e passa a pedir um código de 6 dígitos a cada entrada. É a proteção mais efetiva contra acesso indevido.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "Aba Aplicativo",
        text: "Instala a plataforma como aplicativo no celular ou no computador: abre mais rápido e permite receber avisos.",
      },
    ],
  },

  "/hub/manager/docs": {
    title: "Central de Ajuda",
    summary:
      "O guia completo da plataforma para managers, com os roteiros de atendimento.",
    sections: [
      {
        heading: "O que tem aqui",
        body: "Os guias completos, por assunto: começando, suporte a alunos, aprendizado, operação e situações comuns. É a versão longa do que o (?) de cada página resume.",
      },
      {
        heading: "Os roteiros de atendimento",
        body: [
          "Não consigo entrar na plataforma: o passo a passo para destravar o acesso de um aluno.",
          "Paguei e continua em aberto: o que verificar antes de escalar ao admin.",
          "Quero cancelar minha matrícula: como conduzir sem prometer o que você não executa.",
          "O professor não apareceu: como registrar e garantir o crédito do aluno.",
        ],
      },
      {
        heading: "As regras que você mais vai explicar",
        body: "Cancelamento e remarcação (a regra das 4 horas, o limite de 2 remarcações por mês) e os tipos e a validade dos créditos. Vale ler antes de precisar.",
      },
      {
        heading: "Exceção é decisão humana",
        body: "O sistema aplica as regras automaticamente. Abrir exceção — abonar uma falta, liberar uma terceira remarcação — é decisão da coordenação. Combine antes de prometer ao aluno.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O guia completo",
        text: "A versão longa da ajuda, com os roteiros de atendimento que resolvem a maioria dos casos que chegam.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "A busca",
        text: "Procura dentro de todo o texto dos artigos. Busque pela frase do aluno, como paguei e continua em aberto.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "Os assuntos",
        text: "Começando, suporte a alunos, aprendizado, operação e situações comuns. Situações Comuns é onde estão os roteiros de atendimento.",
      },
      {
        id: "ask",
        target: "docs.ask",
        title: "Perguntar",
        text: "Não achou? Envie sua pergunta. Ela chega à escola, e o que muita gente pergunta acaba virando artigo aqui.",
      },
    ],
  },
};
