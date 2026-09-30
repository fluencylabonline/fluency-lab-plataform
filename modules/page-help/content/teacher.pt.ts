import type { RoleHelpContent, TeacherHelpRoute } from "../page-help.types";

/**
 * Ajuda das páginas do professor — português.
 *
 * As regras de recesso vêm de `modules/scheduling/scheduling.service.ts`
 * (`RECESS_MIN_ADVANCE_DAYS = 30`, `RECESS_MAX_DURATION_DAYS = 15`), não do
 * texto da interface — há strings antigas falando de 20 dias.
 * Ver `.agents/rules/page-help.md`.
 */
export const TEACHER_HELP_PT: RoleHelpContent<TeacherHelpRoute> = {
  "/hub/teacher/profile": {
    title: "Meu Perfil",
    summary: "Seus dados de cadastro e o ponto de partida do seu dia.",
    docsArticleId: "prof-visao-geral",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Seus dados de cadastro, foto e informações de contato. É a tela que abre quando você entra na plataforma.",
      },
      {
        heading: "Onde fica cada coisa",
        body: [
          "Alunos: os alunos vinculados a você, com histórico e progresso de cada um.",
          "Minha Agenda: suas aulas, sua disponibilidade e o registro do que aconteceu em cada encontro.",
          "Lições: a biblioteca de material didático pronto para usar nas aulas.",
          "Meu Aprendizado: os cursos de formação em que você está matriculado.",
          "Contrato: seu contrato de prestação de serviços.",
          "Configurações: senha, notificações e preferências.",
        ],
      },
      {
        heading: "Antes da primeira aula",
        body: "Duas coisas precisam estar feitas: assinar o contrato e cadastrar sua disponibilidade na Agenda. Sem disponibilidade cadastrada você não aparece como opção nas telas de agendamento, e nenhum aluno pode ser alocado com você.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua página inicial",
        text: "Aqui ficam seus dados de cadastro. O trabalho do dia a dia acontece na Agenda e em Alunos.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Por onde circular",
        text: "Alunos, Minha Agenda, Lições, Meu Aprendizado, Contrato e Configurações. No celular este menu fica na barra de baixo.",
      },
      {
        id: "first-steps",
        title: "Antes da primeira aula",
        text: "Assine seu contrato e cadastre sua disponibilidade na Agenda. Enquanto a disponibilidade estiver vazia, você não aparece nas telas de agendamento e nenhum aluno pode ser alocado com você.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "Este botão em toda página",
        text: "O (?) explica a tela em que você está, com um tour como este. Para os guias completos, use a Central de Ajuda no menu.",
      },
    ],
  },

  "/hub/teacher/schedule": {
    title: "Minha Agenda",
    summary:
      "Suas aulas, sua disponibilidade, o registro de cada encontro e seus períodos de recesso.",
    docsArticleId: "prof-disponibilidade",
    sections: [
      {
        heading: "O que o calendário mostra",
        body: "Suas aulas e seus horários livres. Clique numa aula para ver os detalhes, registrar o que aconteceu ou cancelar. Clique num horário livre para ver ou remover a disponibilidade.",
      },
      {
        heading: "Os quatro botões",
        body: [
          "Criar Horário abre um horário de disponibilidade. É o que permite alocar alunos com você.",
          "Atividades de Recesso leva à biblioteca onde você cria as lições que substituem suas aulas durante uma ausência.",
          "Recessos mostra seus recessos já pedidos e a situação de aprovação de cada um.",
          "Comunicar Recesso abre o pedido de um novo período de ausência.",
        ],
      },
      {
        heading: "Disponibilidade é recorrente",
        body: [
          "Você define o horário semanal e o sistema replica nos próximos meses automaticamente.",
          "Horário já ocupado por um aluno fixo não aparece como livre para mais ninguém.",
          "Remover uma disponibilidade não apaga as aulas já agendadas naquele horário — elas precisam ser tratadas uma a uma.",
          "Para mudar o horário fixo de um aluno em definitivo, fale com a secretaria: mexer só na disponibilidade não move a aula recorrente que já existe.",
        ],
      },
      {
        heading: "Registrar o que aconteceu na aula",
        body: [
          "Concluída: a aula aconteceu. Conta como aula dada e entra no seu fechamento pelo seu valor/hora vigente.",
          "Falta do aluno: o aluno não apareceu e não avisou no prazo. Conta como aula dada — você recebe por ela — e o aluno não tem direito a reposição.",
          "Cancelada por mim: gera automaticamente um crédito de reposição para o aluno, que remarca sem gastar a cota mensal dele. Não conta como aula dada e não entra no seu pagamento.",
        ],
      },
      {
        heading: "Registre no dia",
        body: "Aula sem registro fica pendente e depois é marcada como atrasada pelo sistema. O fechamento usa o que está registrado na data de apuração: aula registrada depois do fechamento entra só no mês seguinte.",
      },
      {
        heading: "As regras do recesso",
        body: "O recesso exige pelo menos 30 dias corridos de aviso prévio e não pode passar de 15 dias corridos. Fora disso o sistema bloqueia. Antes de confirmar, é preciso escolher uma atividade de recesso para cada aula afetada — a atividade não precisa ser sua, qualquer lição da biblioteca serve. Alunos e coordenação são avisados na confirmação.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua agenda",
        text: "É a tela onde você abre horários, registra o que aconteceu em cada aula e comunica ausências. Vamos por partes.",
      },
      {
        id: "calendar",
        target: "teacher-schedule.calendar",
        title: "O calendário",
        text: "Suas aulas e seus horários livres. Clique numa aula para registrar o que aconteceu ou cancelar; clique num horário livre para ver ou remover a disponibilidade.",
      },
      {
        id: "create-slot",
        target: "teacher-schedule.create-slot",
        title: "Criar Horário",
        text: "Abre um horário de disponibilidade. Ele é recorrente: você define o horário semanal e o sistema replica nos próximos meses. Enquanto sua disponibilidade estiver vazia, nenhum aluno pode ser alocado com você.",
      },
      {
        id: "register",
        target: "teacher-schedule.calendar",
        title: "Registrar a aula",
        text: "Concluída conta como aula dada e entra no seu pagamento. Falta do aluno também conta e é remunerada. Cancelada por mim gera crédito para o aluno e não entra no seu pagamento. Registre no dia: o fechamento usa o que estava registrado na apuração.",
      },
      {
        id: "recess-library",
        target: "teacher-schedule.recess-library",
        title: "Atividades de Recesso",
        text: "A biblioteca das lições que substituem suas aulas durante uma ausência. Vale montar as suas antes de precisar delas.",
      },
      {
        id: "communicate-recess",
        target: "teacher-schedule.communicate-recess",
        title: "Comunicar Recesso",
        text: "Pede um período de ausência. Exige no mínimo 30 dias corridos de aviso e no máximo 15 dias corridos de duração — fora disso o sistema bloqueia. Você também escolhe uma atividade para cada aula afetada antes de confirmar.",
      },
      {
        id: "check-recess",
        target: "teacher-schedule.check-recess",
        title: "Recessos",
        text: "Seus pedidos de recesso e a situação de cada um: aprovado automaticamente quando está dentro do prazo, ou em revisão quando precisa do aval da coordenação.",
      },
    ],
  },

  "/hub/teacher/students": {
    panel: "wizard",
    title: "Meus Alunos",
    summary: "Os alunos com aula agendada com você, com a ficha completa de cada um.",
    docsArticleId: "prof-lista-alunos",
    tour: [
      {
        id: "intro",
        title: "Seus alunos",
        text: "A lista traz os alunos com aula agendada com você. Clique num nome para abrir a ficha: aulas, cadernos, plano de estudos e nivelamento.",
      },
      {
        id: "list",
        target: "teacher-students.list",
        title: "A lista",
        text: "Um cartão por aluno. Toque para abrir a ficha completa dele.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "Buscar por nome ou e-mail",
        text: "A busca no topo do header filtra a lista por nome ou e-mail, o que ajuda quando você tem muitos alunos.",
      },
      {
        id: "privacy",
        title: "Você vê só os seus",
        text: "Por proteção de dados, sua visão é limitada aos alunos vinculados a você, e só a dados pedagógicos. Informação financeira e documento pessoal ficam restritos à administração.",
      },
      {
        id: "missing",
        title: "Um aluno sumiu da lista?",
        text: "A lista depende de haver aula agendada com você. Aluno sem aula marcada, ou realocado para outro professor, deixa de aparecer. Se parecer errado, fale com a secretaria.",
      },
    ],
  },

  "/hub/teacher/students/[studentId]": {
    panel: "wizard",
    title: "Ficha do aluno",
    summary:
      "Tudo sobre um aluno seu: cadernos das aulas, plano de estudos e histórico de encontros.",
    docsArticleId: "prof-lista-alunos",
    tour: [
      {
        id: "intro",
        title: "A ficha do aluno",
        text: "Três painéis, um por assunto. No desktop aparecem lado a lado; no tablet e no celular, pelos botões do topo.",
      },
      {
        id: "notebooks",
        target: "teacher-student-detail.notebooks",
        title: "Cadernos",
        text: "Um caderno por aula. Novo cria o caderno da próxima aula, a busca acha um antigo pelo título, e o ícone de nuvem baixa em PDF. Excluir move para a lixeira, com remoção definitiva após 60 dias.",
      },
      {
        id: "plan",
        target: "teacher-student-detail.plan",
        title: "Plano de estudos",
        text: "A trilha de lições do aluno. Dá para adicionar uma lição solta, aplicar um modelo de plano inteiro e reordenar o que já existe. É isto que o aluno vê como trilha no Caderno dele.",
      },
      {
        id: "classes",
        target: "teacher-student-detail.classes",
        title: "Aulas",
        text: "O histórico de encontros com a situação de cada um. É aqui que você muda o status de uma aula e escreve o feedback que o aluno lê depois.",
      },
      {
        id: "feedback",
        target: "teacher-student-detail.classes",
        title: "Feedback da aula",
        text: "Escreva pensando em quem vai reler dias depois, sem o contexto da conversa. É a principal ferramenta de continuidade entre uma aula e a seguinte.",
      },
    ],
  },

  "/hub/teacher/students/[studentId]/profile": {
    title: "Diagnóstico Pedagógico",
    summary:
      "Um relatório sobre o aluno, gerado por inteligência artificial a partir do questionário de matrícula e do nivelamento.",
    sections: [
      {
        heading: "O que é este relatório",
        body: "Uma leitura pedagógica do aluno feita por IA, cruzando o que ele respondeu no questionário de matrícula com o resultado do nivelamento: objetivo, contexto, pontos de atenção e sugestões de caminho. É o contexto que a lista de aulas não dá.",
      },
      {
        heading: "Dados Estruturais",
        body: [
          "Nível Percebido é o nível que o próprio aluno se atribuiu na matrícula — pode não bater com o nivelamento, e a diferença em si já é informação.",
          "Comprometimento é o quanto ele declarou que pretende se dedicar, de 0 a 10.",
        ],
      },
      {
        heading: "Para você é só leitura",
        body: "Professor visualiza, não edita. Gerar ou refazer o diagnóstico e criar o plano a partir dele são ações da coordenação. Se algo no relatório parece errado, fale com ela.",
      },
      {
        heading: "Quando vale a pena abrir",
        body: [
          "Antes da primeira aula, para não começar no escuro.",
          "Quando o aluno parece desmotivado: muitas vezes o objetivo dele mudou e o plano não acompanhou.",
          "Ao revisar o plano de estudos, para conferir se ele ainda serve ao objetivo declarado.",
        ],
      },
      {
        heading: "Relatório vazio?",
        body: "Se aparecer aguardando geração do diagnóstico, é porque a coordenação ainda não o gerou. O questionário do aluno pode estar respondido sem que o relatório exista.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O contexto do aluno",
        text: "Um relatório pedagógico gerado por IA a partir do questionário de matrícula e do nivelamento. Vale ler antes da primeira aula.",
      },
      {
        id: "report",
        target: "teacher-student-profile.report",
        title: "Relatório Pedagógico",
        text: "A leitura do aluno feita pela IA: objetivo, contexto, pontos de atenção e sugestões. No pé ficam a referência e a data da última atualização — bom conferir se não está velho.",
      },
      {
        id: "metrics",
        target: "teacher-student-profile.metrics",
        title: "Dados Estruturais",
        text: "Nível Percebido é o que o aluno se atribuiu na matrícula, e pode não bater com o nivelamento — a diferença já é informação. Comprometimento é quanto ele declarou pretender se dedicar, de 0 a 10.",
      },
      {
        id: "read-only",
        title: "Para você é só leitura",
        text: "Gerar o diagnóstico e criar o plano a partir dele são ações da coordenação. Se algo aqui parece errado, fale com ela.",
      },
      {
        id: "use",
        title: "Como usar",
        text: "Confira se o plano de estudos ainda serve ao objetivo declarado. Se o aluno parece desmotivado, compare o que ele pediu no começo com o que está recebendo — é onde a resposta costuma estar.",
      },
    ],
  },

  "/hub/teacher/lessons": {
    title: "Lições",
    summary:
      "A biblioteca de material didático pronto, filtrável por idioma e nível.",
    docsArticleId: "prof-licoes",
    sections: [
      {
        heading: "O que fica aqui",
        body: "O material didático já produzido e revisado pela escola. Abra uma lição para usar durante a aula ou como base do seu planejamento.",
      },
      {
        heading: "Os filtros",
        body: "Nível e idioma são etiquetas clicáveis: clicar marca o filtro, clicar de novo na mesma etiqueta remove. A busca do header procura pelo título. Combinar nível com busca é o caminho mais rápido quando a biblioteca está grande.",
      },
      {
        heading: "Só material pronto aparece",
        body: "A lista mostra apenas lições com situação pronta. Material em produção fica visível só para quem está montando o conteúdo — então uma lição que você viu alguém citar pode ainda não estar aqui.",
      },
      {
        heading: "Estas não são as atividades de recesso",
        body: "A biblioteca de recesso é outra tela, acessível pela Agenda. Uma lição daqui pode ser usada como atividade de recesso no momento de comunicar a ausência.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A biblioteca de lições",
        text: "Material didático pronto para usar em aula, produzido e revisado pela escola.",
      },
      {
        id: "filters",
        target: "teacher-lessons.filters",
        title: "Filtrar por nível e idioma",
        text: "São etiquetas clicáveis: clique para filtrar, clique de novo na mesma para remover. Junto com a busca por título no header, é a forma mais rápida de achar o que serve.",
      },
      {
        id: "list",
        target: "teacher-lessons.list",
        title: "As lições",
        text: "Toque numa lição para abrir o conteúdo. Só aparecem as com situação pronta — material em produção não fica visível aqui.",
      },
    ],
  },

  "/hub/teacher/lessons/[lessonId]": {
    title: "Lição",
    summary: "O conteúdo de uma lição da biblioteca, para usar em aula.",
    docsArticleId: "prof-licoes",
    sections: [
      {
        heading: "O que você vê",
        body: "De um lado, o conteúdo completo da lição. Do outro, os Itens de Aprendizado que ela cobre, separados em Vocabulário e Estruturas, com a tradução de cada um. No topo ficam duas etiquetas: o nível e o idioma da lição.",
      },
      {
        heading: "Esta tela é só leitura",
        body: "A lição pertence à biblioteca da escola. Você não edita daqui — sugestões de correção vão para a coordenação.",
      },
      {
        heading: "Usar com um aluno",
        body: "Para colocar esta lição na trilha de alguém, abra a ficha do aluno e use o painel de plano de estudos. A lição aparece na busca de lições de lá.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O conteúdo da lição",
        text: "Pronto para usar ao vivo ou como base do seu planejamento.",
      },
      {
        id: "content",
        target: "teacher-lesson.content",
        title: "O material",
        text: "O conteúdo da lição na ordem em que foi montado. A tela é só leitura: a lição pertence à biblioteca da escola. No celular, este é o painel da aba Conteúdo.",
      },
      {
        id: "items",
        target: "teacher-lesson.items",
        title: "Itens de Aprendizado",
        text: "O que a lição cobre, separado em Vocabulário e Estruturas, com a tradução de cada item. Serve para conferir rápido se a lição bate com o que o aluno precisa. No celular, fica na aba Vocabulário.",
      },
      {
        id: "assign",
        title: "Para usar com um aluno",
        text: "Abra a ficha do aluno e adicione esta lição pelo painel de plano de estudos. Ela aparece na busca de lições de lá.",
      },
    ],
  },

  "/hub/teacher/my-courses": {
    title: "Meu Aprendizado",
    summary: "Os cursos de formação da escola em que você está matriculado.",
    docsArticleId: "prof-meu-aprendizado",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Cursos de formação e capacitação disponibilizados pela escola para você. Funcionam igual aos cursos dos alunos: seções, lições e progresso salvo automaticamente.",
      },
      {
        heading: "Não é a biblioteca de lições",
        body: "Estes cursos são para o seu desenvolvimento. O material que você usa em aula com alunos fica em Lições.",
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
        text: "Os cursos que a escola disponibiliza para o seu desenvolvimento — não o material de aula, que fica em Lições.",
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

  "/hub/teacher/my-courses/[id]": {
    title: "Assistindo ao curso",
    summary: "O player do curso de formação: conteúdo, menu de lições e quizzes.",
    docsArticleId: "prof-meu-aprendizado",
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

  "/hub/teacher/recess": {
    title: "Biblioteca de Recesso",
    summary:
      "As atividades que substituem suas aulas quando você está em recesso.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "Para que serve",
        body: "Quando você comunica um recesso, o sistema exige uma atividade para cada aula afetada — o aluno faz essa atividade no lugar do encontro. Esta é a biblioteca de onde essas atividades saem.",
      },
      {
        heading: "Os botões",
        body: [
          "Criar uma lição abre o editor de uma atividade sua, com texto e quiz.",
          "O lápis em cada cartão abre a atividade para editar.",
          "Os cartões mostram idioma e nível, para você achar a adequada a cada aluno.",
        ],
      },
      {
        heading: "Não precisa ser sua",
        body: "Na hora de comunicar o recesso você pode escolher qualquer atividade já existente na biblioteca, inclusive de outros professores. Criar as suas é opcional — mas dá mais controle sobre o que seus alunos recebem.",
      },
      {
        heading: "Monte antes de precisar",
        body: "O recesso exige 30 dias corridos de aviso prévio, e você não confirma o pedido sem escolher uma atividade para cada aula. Ter as suas prontas evita correria nesse momento.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Atividades para o seu recesso",
        text: "Quando você se ausenta, cada aula afetada precisa de uma atividade no lugar. Elas ficam aqui.",
      },
      {
        id: "new",
        target: "teacher-recess.new",
        title: "Criar uma lição",
        text: "Abre o editor de uma atividade sua, com texto e quiz. Na hora do recesso você também pode usar atividades de outros professores — criar as suas é opcional, mas dá mais controle.",
      },
      {
        id: "list",
        target: "teacher-recess.list",
        title: "A biblioteca",
        text: "Cada cartão mostra idioma e nível, para você escolher a adequada a cada aluno. O lápis abre para editar.",
      },
      {
        id: "plan-ahead",
        title: "Monte antes de precisar",
        text: "O recesso exige 30 dias corridos de aviso e não deixa confirmar sem uma atividade escolhida para cada aula. Ter as suas prontas evita correria.",
      },
    ],
  },

  "/hub/teacher/recess/new": {
    title: "Nova Atividade de Recesso",
    summary:
      "Monte uma atividade — texto e quiz — para os alunos fazerem na sua ausência.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "Os campos do cabeçalho",
        body: [
          "Título: como a atividade aparece na biblioteca e na hora de escolher. Seja específico.",
          "Idioma: a língua da atividade.",
          "Nível: para quem ela serve. É o que permite escolher a adequada a cada aluno depois.",
          "Idioma nativo: a língua de apoio nas instruções.",
        ],
      },
      {
        heading: "Os dois botões que alternam o painel",
        body: [
          "Conteúdo da Atividade abre o editor do texto que o aluno lê. Aceita formatação.",
          "Avaliação (Quiz) abre o quiz. O número ao lado mostra quantas questões já existem.",
        ],
      },
      {
        heading: "Montando o quiz",
        body: [
          "Nova Questão adiciona uma pergunta.",
          "Cada questão tem o enunciado e as opções de resposta, com a correta marcada.",
          "Nota de Corte define a porcentagem de acertos considerada aprovação.",
          "O quiz é opcional: atividade só com texto é válida.",
        ],
      },
      {
        heading: "Ao salvar",
        body: "Criar Atividade coloca a atividade na biblioteca, disponível para você e para os outros professores na hora de comunicar um recesso.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Criando uma atividade",
        text: "Duas partes: o conteúdo que o aluno lê e, se você quiser, um quiz para verificar o aprendizado.",
      },
      {
        id: "meta",
        target: "teacher-recess-editor.meta",
        title: "Título, idioma e nível",
        text: "O título é como a atividade aparece na hora de escolher — seja específico. Idioma e nível são o que permite achar a atividade adequada a cada aluno depois.",
      },
      {
        id: "tabs",
        target: "teacher-recess-editor.tabs",
        title: "Conteúdo e Avaliação",
        text: "Estes dois botões alternam o painel ao lado. Conteúdo da Atividade é o texto que o aluno lê; Avaliação (Quiz) é o quiz, com o número de questões ao lado. O quiz é opcional: atividade só com texto é válida.",
      },
      {
        id: "quiz",
        target: "teacher-recess-editor.tabs",
        title: "Montando o quiz",
        text: "Nova Questão adiciona uma pergunta com suas opções e a resposta correta marcada. Nota de Corte define a porcentagem de acertos que conta como aprovação.",
      },
      {
        id: "save",
        target: "teacher-recess-editor.save",
        title: "Criar Atividade",
        text: "Salva na biblioteca. A partir daí ela pode ser escolhida em qualquer recesso, seu ou de outro professor.",
      },
    ],
  },

  "/hub/teacher/recess/[id]": {
    title: "Editar Atividade de Recesso",
    summary: "Ajuste o texto, o quiz ou o nível de uma atividade que já existe.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "O que você pode mudar",
        body: "Tudo: título, idioma, nível, o texto da atividade e as questões do quiz. Salvar Alterações grava por cima da versão anterior.",
      },
      {
        heading: "Cuidado ao editar uma atividade em uso",
        body: "Se esta atividade já foi escolhida para um recesso em andamento, a mudança vale para os alunos que ainda não a fizeram. Para um conteúdo bem diferente, prefira criar uma atividade nova em vez de reaproveitar esta.",
      },
      {
        heading: "O quiz",
        body: "Nova Questão adiciona pergunta, o ícone de lixeira remove. Nota de Corte define a porcentagem de acertos que conta como aprovação. Remover todas as questões deixa a atividade só com texto, o que é válido.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Editando a atividade",
        text: "Tudo é editável: título, idioma, nível, texto e quiz.",
      },
      {
        id: "meta",
        target: "teacher-recess-editor.meta",
        title: "Título, idioma e nível",
        text: "Mudar o nível muda para quais alunos esta atividade vai aparecer como opção adequada nos próximos recessos.",
      },
      {
        id: "tabs",
        target: "teacher-recess-editor.tabs",
        title: "Conteúdo e Avaliação",
        text: "Estes dois botões alternam o painel ao lado. Em Avaliação (Quiz) você adiciona ou remove questões e ajusta a Nota de Corte. Sem questões, a atividade fica só com texto — o que é válido.",
      },
      {
        id: "save",
        target: "teacher-recess-editor.save",
        title: "Salvar Alterações",
        text: "Grava por cima da versão anterior. Se a atividade já está em uso num recesso em andamento, a mudança vale para quem ainda não a fez.",
      },
    ],
  },

  "/hub/teacher/contract": {
    title: "Meu Contrato",
    summary:
      "Seu contrato de prestação de serviços: onde ler, assinar e baixar o PDF.",
    docsArticleId: "prof-contrato",
    sections: [
      {
        heading: "O que fica nesta tela",
        body: "Seu contrato com a escola, com a validade e a situação atual: Contrato Ativo, Assinatura Pendente ou Contrato Expirado. Perto do vencimento, um aviso mostra em quantos dias.",
      },
      {
        heading: "Os botões",
        body: [
          "Baixar PDF salva uma cópia no seu aparelho.",
          "Receber por E-mail envia o PDF para o e-mail da sua conta.",
          "Havendo assinatura pendente, a tela mostra os termos e o botão para assinar digitalmente.",
        ],
      },
      {
        heading: "Assine antes da primeira aula",
        body: "Enquanto o contrato estiver pendente, sua situação fica incompleta na escola. É um dos dois passos iniciais, junto com cadastrar disponibilidade na Agenda.",
      },
      {
        heading: "Renovação",
        body: "O contrato tem prazo de vigência e é renovado periodicamente. Você é avisado quando a renovação se aproxima.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Seu contrato",
        text: "Onde ler, assinar e guardar seu contrato de prestação de serviços.",
      },
      {
        id: "status",
        target: "student-contract.status",
        title: "Situação e validade",
        text: "Mostra se o contrato está ativo, esperando sua assinatura ou expirado, e até quando vale. Perto do fim, um aviso indica quantos dias restam.",
      },
      {
        id: "actions",
        target: "student-contract.actions",
        title: "Baixar e receber por e-mail",
        text: "Baixar PDF salva a cópia no seu aparelho. Receber por E-mail manda o arquivo para o e-mail da sua conta — útil para guardar fora da plataforma.",
      },
      {
        id: "first-steps",
        title: "Assine antes da primeira aula",
        text: "Contrato pendente deixa sua situação incompleta na escola. É um dos dois passos iniciais, ao lado de cadastrar sua disponibilidade na Agenda.",
      },
    ],
  },

  "/hub/teacher/settings": {
    panel: "wizard",
    title: "Configurações",
    summary:
      "Seus dados, idioma, tema, avisos que você recebe e a segurança da sua conta.",
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
        text: "Foto, nome, e-mail principal (com selo de verificado) e o idioma da interface. É também onde fica Exportar Meus Dados, que baixa uma cópia de tudo o que guardamos sobre você.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Aba Notificações",
        text: "Uma chave para cada tipo de aviso. Vale manter ligados os de aula e agendamento: é como você fica sabendo de cancelamento de aluno e de mudança na sua agenda.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Aba Segurança",
        text: "Troque a senha aqui de vez em quando. A verificação em duas etapas usa um app de autenticação e passa a pedir um código de 6 dígitos a cada entrada — importante, porque sua conta acessa dados de alunos.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "Aba Aplicativo",
        text: "Instala a plataforma como aplicativo no celular ou no computador: abre mais rápido e permite receber avisos de aula.",
      },
    ],
  },

  "/hub/teacher/docs": {
    title: "Central de Ajuda",
    summary:
      "O guia completo da plataforma para professores, com busca e uma área para perguntar.",
    sections: [
      {
        heading: "O que tem aqui",
        body: "Os guias completos, por assunto: começando, agenda e aulas, alunos, material didático, contrato e ganhos, e problemas comuns. É a versão longa do que o (?) de cada página resume.",
      },
      {
        heading: "Como achar o que precisa",
        body: "A busca no topo procura em todo o texto dos artigos, não só nos títulos. Vale buscar pelo problema em palavras suas — por exemplo, o aluno não apareceu ou minha agenda está errada.",
      },
      {
        heading: "Onde estão as regras que mais geram dúvida",
        body: [
          "Como seus ganhos são calculados, em Contrato e Ganhos.",
          "O que cada status de registro de aula significa para o seu pagamento.",
          "As regras de prazo e duração do recesso.",
        ],
      },
      {
        heading: "Não achou a resposta?",
        body: "Dá para enviar sua pergunta. Ela chega à escola, e o que aparece com frequência vira artigo novo aqui.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O guia completo",
        text: "Esta é a versão longa da ajuda. O (?) de cada página resume a tela; aqui ficam os guias inteiros.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "A busca",
        text: "Procura dentro de todo o texto dos artigos. Descreva o problema com suas palavras, como o aluno não apareceu.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "Os assuntos",
        text: "Começando, agenda e aulas, alunos, material didático, contrato e ganhos, e problemas comuns. Contrato e Ganhos é onde ficam as regras de pagamento.",
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
