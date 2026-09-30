import type { RoleHelpContent, StudentHelpRoute } from "../page-help.types";

/**
 * Ajuda das páginas do aluno — português.
 *
 * Escrito na segunda pessoa, falando direto com o aluno, no mesmo tom de
 * `modules/docs/docs.content.student.ts`. Regras de negócio (prazos, créditos,
 * tolerâncias) vêm de lá e do `class.service`/`billing.service` — nada aqui é
 * deduzido. Ver `.agents/rules/page-help.md`.
 */
export const STUDENT_HELP_PT: RoleHelpContent<StudentHelpRoute> = {
  "/hub/student/profile": {
    panel: "wizard",
    title: "Meu Perfil",
    summary:
      "Sua página inicial: próxima aula, situação do pagamento, progresso e conquistas, tudo num lugar.",
    docsArticleId: "aluno-visao-geral",
    tour: [
      {
        id: "intro",
        title: "Esta é a sua página inicial",
        text: "Tudo o que precisa de atenção aparece aqui: a próxima aula, o pagamento do mês e como está sua evolução. Vamos passar por cada parte.",
      },
      {
        id: "next-class",
        target: "student-profile.next-class",
        title: "Sua próxima aula",
        text: "Dia, horário e professor da próxima aula marcada. Quando o horário chega, o botão Acessar Sala abre a chamada de vídeo. Sem aula marcada, o cartão avisa que sua agenda está vazia.",
      },
      {
        id: "payment",
        target: "student-profile.payment",
        title: "Situação do seu pagamento",
        text: "Mostra o plano e se a mensalidade do mês está paga ou em aberto. Havendo parcela vencida, um aviso aparece com o PIX para você quitar na hora.",
      },
      {
        id: "onboarding",
        target: "student-profile.onboarding",
        title: "O que ainda falta fazer",
        text: "Os três primeiros passos da sua matrícula: assinar o contrato, fazer o nivelamento e abrir seu primeiro curso. Clique em qualquer item pendente para ir direto até ele.",
      },
      {
        id: "progress",
        target: "student-profile.progress",
        title: "Como você está evoluindo",
        text: "Retenção de conteúdo, nível de vocabulário e quantas aulas do ciclo já aconteceram. Logo abaixo ficam sua ofensiva de dias seguidos e o aviso de prática diária pendente.",
      },
      {
        id: "badges",
        target: "student-profile.badges",
        title: "Seus níveis de proficiência",
        text: "Cada ícone representa um estágio da sua fluência. Toque para ver todos os estágios e onde você está. Sem nivelamento feito, o cartão convida você a começar.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Como circular pela plataforma",
        text: "Por aqui você chega ao Caderno, ao Calendário, aos Cursos, à Imersão e às Configurações. No celular, este menu fica na barra de baixo.",
      },
      {
        id: "notifications",
        target: "chrome.notifications",
        title: "Seus avisos",
        text: "O sininho guarda os avisos da escola: lembrete de aula, confirmação de pagamento, recado do professor. O número em cima dele é quantos você ainda não leu.",
        only: "desktop",
      },
      {
        id: "theme",
        target: "chrome.theme",
        title: "Claro ou escuro",
        text: "Troca o visual da plataforma entre claro, escuro ou seguir o aparelho. No celular esta opção fica dentro do menu da sua foto.",
        only: "desktop",
      },
      {
        id: "account",
        target: "chrome.account",
        title: "Sua conta",
        text: "Sua foto abre o menu da conta: perfil, configurações, troca de idioma e sair. No celular é também onde ficam o tema e o idioma.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "Este botão em toda página",
        text: "O (?) está em todas as telas e sempre explica a página em que você está — inclusive com um tour como este.",
      },
    ],
  },

  "/hub/student/schedule": {
    panel: "wizard",
    title: "Meu Cronograma",
    summary:
      "Seu calendário de aulas: é aqui que você cancela, remarca e acompanha seus créditos de reposição.",
    docsArticleId: "aluno-calendario",
    tour: [
      {
        id: "intro",
        title: "Seu calendário de aulas",
        text: "Todas as suas aulas aparecem aqui, mês a mês. Este tour mostra como cancelar, remarcar e o que significa cada situação.",
      },
      {
        id: "calendar",
        target: "student-schedule.calendar",
        title: "O calendário",
        text: "Cada marca é uma aula. Clique em uma para ver data, horário, professor e situação — e para cancelar ou remarcar. O calendário abre sempre no mês atual.",
      },
      {
        id: "credits",
        target: "student-schedule.credits",
        title: "Seus créditos e sua cota",
        text: "A cota mensal permite remarcar até 2 aulas por mês civil, e ela não acumula para o mês seguinte. Os créditos de reposição são separados: vêm de cancelamentos do professor, de bônus da escola ou de atraso nosso.",
        only: "desktop",
      },
      {
        id: "credits-mobile",
        target: "student-schedule.credits-button",
        title: "Seus créditos e sua cota",
        text: "Toque em Créditos para ver sua cota do mês (2 remarcações, sem acumular) e seus créditos de reposição, que vêm de cancelamentos do professor ou de bônus da escola.",
        only: "mobile",
      },
      {
        id: "reschedule",
        target: "student-schedule.calendar",
        title: "Remarcar uma aula",
        text: "Abra a aula e escolha Reagendar. O sistema lista os horários livres do seu professor nos próximos 14 dias e pergunta se você quer gastar a cota do mês ou um crédito de reposição.",
      },
      {
        id: "cancel",
        target: "student-schedule.calendar",
        title: "A regra das 4 horas",
        text: "Cancelando com mais de 4 horas de antecedência, é um cancelamento normal. Com menos de 4 horas, a aula entra como falta — e falta conta como aula dada, sem reposição. Nesse prazo também não dá mais para remarcar.",
      },
      {
        id: "status",
        target: "student-schedule.calendar",
        title: "O que cada situação significa",
        text: "Agendada é confirmada. Concluída já aconteceu. Falta é cancelamento em cima da hora ou atraso além dos 15 minutos de tolerância. Cancelada pelo professor gera crédito de reposição para você. Recesso é pausa avisada pelo professor, com atividade no lugar da aula.",
      },
    ],
  },

  "/hub/student/notebook": {
    panel: "wizard",
    title: "Meu Caderno",
    summary:
      "As anotações de todas as suas aulas, sua trilha de lições e o resumo do que você já aprendeu.",
    docsArticleId: "aluno-caderno",
    tour: [
      {
        id: "intro",
        title: "Seu caderno de aulas",
        text: "Cada aula gera uma página aqui, com o que foi trabalhado e as observações do professor. É o melhor lugar para revisar antes do próximo encontro.",
      },
      {
        id: "stats",
        target: "student-notebook.stats",
        title: "Seu progresso em números",
        text: "Quantos itens você revisou hoje, quantos estão esperando revisão e quantos já considera aprendidos. Toque em Revisados ou Aprendidos para ver a lista completa, separada entre vocabulário e estrutura.",
      },
      {
        id: "path",
        target: "student-notebook.path",
        title: "Sua trilha de lições",
        text: "O caminho mostra as lições do plano montado pelo seu professor, dia por dia. As com cadeado abrem quando você chega nelas. Sem plano ativo, a trilha avisa para falar com seu professor.",
      },
      {
        id: "notebooks",
        target: "student-notebook.notebooks",
        title: "Suas anotações por aula",
        text: "A lista de cadernos, um por aula, com busca por nome. Abra um para ler as anotações ou baixar em PDF.",
        only: "desktop",
      },
      {
        id: "notebooks-mobile",
        target: "student-notebook.notebooks-button",
        title: "Suas anotações por aula",
        text: "Toque em Cadernos para ver a lista, um caderno por aula, com busca por nome. Abra um para ler as anotações ou baixar em PDF.",
        only: "mobile",
      },
      {
        id: "wotd",
        target: "student-notebook.wotd",
        title: "Palavra do Dia",
        text: "Uma palavra nova por dia, com significado, pronúncia e exemplo, e um exercício rápido para fixar. Leva menos de um minuto.",
      },
      {
        id: "attachments",
        title: "Anexos têm prazo",
        text: "Arquivos e imagens anexados às aulas ficam disponíveis por um período e depois são removidos automaticamente. Se algum material for importante para você, baixe e guarde.",
      },
    ],
  },

  "/hub/student/settings": {
    panel: "wizard",
    title: "Configurações",
    summary:
      "Seus dados, idioma, tema, avisos que você recebe e a segurança da sua conta.",
    docsArticleId: "aluno-configuracoes",
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
        text: "Foto, nome, e-mail principal (com selo de verificado) e o idioma da interface. É também onde ficam Exportar Meus Dados, que baixa uma cópia de tudo o que guardamos sobre você, e a solicitação de cancelamento da conta.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Aba Notificações",
        text: "Uma chave para cada tipo de aviso: aulas e agendamentos, lembretes de ofensiva (depois das 20h), alertas de novas lições, mensagens do chat e novidades da escola. Desligar os avisos de aula significa não receber o lembrete antes de cada encontro — os de pagamento continuam, por serem obrigação do contrato.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Aba Segurança",
        text: "Troque sua senha aqui de vez em quando. A verificação em duas etapas usa um app de autenticação (Google Authenticator, Authy) e passa a pedir um código de 6 dígitos a cada entrada — é a melhor proteção da sua conta.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "Aba Aplicativo",
        text: "Instala a plataforma como aplicativo no celular ou no computador: abre mais rápido, ocupa a tela inteira e permite receber avisos de aula.",
      },
    ],
  },

  "/hub/student/placement": {
    panel: "wizard",
    title: "Nivelamento",
    summary:
      "O teste que mede seu nível no idioma e o histórico de todos os que você já fez.",
    docsArticleId: "aluno-nivelamento",
    tour: [
      {
        id: "intro",
        title: "Para que serve o nivelamento",
        text: "O teste mede onde você está no idioma. O resultado orienta seu professor no planejamento das aulas e serve de marco para você acompanhar a evolução. Não é prova: não existe nota boa ou ruim, existe ponto de partida.",
      },
      {
        id: "start",
        target: "student-placement.start",
        title: "Começar um nivelamento",
        text: "Iniciar Avaliação abre o teste. Ele é adaptativo: começa simples e ajusta a dificuldade ao seu desempenho, e leva de 10 a 15 minutos.",
      },
      {
        id: "resume",
        target: "student-placement.start",
        title: "Teste em andamento",
        text: "Se você saiu no meio, o cartão muda para Retomar Teste e volta exatamente de onde parou — seu progresso fica salvo. É preciso terminar o teste em andamento antes de iniciar outro.",
      },
      {
        id: "cooldown",
        target: "student-placement.start",
        title: "Um teste a cada 6 meses",
        text: "Para o resultado ter valor, há um intervalo de 6 meses entre nivelamentos. Dentro do intervalo, a tela mostra a data em que o próximo estará liberado.",
      },
      {
        id: "history",
        target: "student-placement.history",
        title: "Seus resultados",
        text: "Cada teste concluído fica guardado aqui com nível e data. Abra um para ver o nível estimado, quantas questões você acertou e a análise por habilidade. Comparar dois resultados é a forma mais direta de ver sua evolução.",
      },
    ],
  },

  "/hub/student/placement/test": {
    title: "Teste de Nivelamento",
    summary:
      "O teste em si: perguntas que se ajustam ao seu desempenho até encontrar seu nível.",
    docsArticleId: "aluno-nivelamento",
    sections: [
      {
        heading: "Como o teste funciona",
        body: "Ele é adaptativo: começa com questões simples e vai ajustando a dificuldade conforme você acerta ou erra, até encontrar seu nível real. São de 10 a 15 minutos no total.",
      },
      {
        heading: "Os botões da tela",
        body: [
          "Verificar confirma a resposta escolhida e mostra na hora se acertou, com a solução correta quando erra.",
          "Pular passa a questão sem responder — vale quando você realmente não sabe, já que chutar distorce o resultado.",
          "Continuar vai para a próxima questão depois do retorno.",
          "Em questões de áudio, o player repete o som quantas vezes você quiser.",
        ],
      },
      {
        heading: "Se você precisar sair",
        body: "Pode sair no meio: seu progresso é salvo e a página de Nivelamento mostra Retomar Teste para você voltar de onde parou. Só não é possível começar um teste novo antes de terminar este.",
      },
      {
        heading: "Responda sem consultar",
        body: "Não existe nota boa ou ruim — existe ponto de partida. Um resultado inflado só atrapalha o planejamento das suas aulas.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Você está no teste",
        text: "Responda com calma e sem consultar nada. O teste se ajusta ao seu desempenho, então errar faz parte — é assim que ele encontra seu nível.",
      },
      {
        id: "question",
        target: "placement-test.question",
        title: "A questão",
        text: "Pode ser escolha de alternativa, texto livre, ordenar palavras ou compreensão de áudio. Em questões de áudio, o player repete o som quantas vezes você precisar.",
      },
      {
        id: "actions",
        target: "placement-test.actions",
        title: "Verificar e Pular",
        text: "Verificar confirma sua resposta e mostra na hora se acertou, com a solução quando erra. Pular passa sem responder — melhor pular do que chutar.",
      },
      {
        id: "exit",
        title: "Sair no meio é seguro",
        text: "Se precisar parar, seu progresso fica salvo e você volta de onde parou pela página de Nivelamento.",
      },
    ],
  },

  "/hub/student/payments": {
    title: "Pagamentos",
    summary:
      "Todas as parcelas do seu plano, com valor, vencimento, situação e o PIX de cada uma.",
    docsArticleId: "aluno-mensalidades",
    sections: [
      {
        heading: "O que a lista mostra",
        body: "Uma linha por parcela, com valor, data de vencimento e situação (paga, em aberto ou vencida). O vencimento cai sempre entre os dias 1º e 10 de cada mês.",
      },
      {
        heading: "Como pagar",
        body: [
          "Toque na parcela em aberto para abrir os detalhes do pagamento.",
          "Escaneie o QR Code pelo app do seu banco ou use Copiar Código para colar o PIX.",
          "Confira o valor no seu banco e confirme.",
          "A baixa é automática e costuma acontecer em poucos minutos.",
        ],
      },
      {
        heading: "Os botões de cada parcela",
        body: [
          "Ver recibo aparece nas parcelas pagas e abre o comprovante.",
          "Copiar Código copia o PIX copia e cola para o app do banco.",
          "Já paguei, verificar pagamento força uma nova consulta ao banco quando a baixa demora.",
          "Gerar novo PIX aparece em parcela vencida e cria um código novo, já que o antigo expira.",
          "Ir para o Pagamento aparece em planos em dólar e leva à página segura da Stripe, para cartão internacional.",
        ],
      },
      {
        heading: "Use sempre o PIX daqui",
        body: "Pagamento feito em outra chave PIX não é reconhecido automaticamente, e sua parcela fica em aberto até alguém conferir na mão. Use sempre o código gerado nesta tela.",
      },
      {
        heading: "Parcela vencida",
        body: "Um aviso fixo aparece no topo da plataforma e some sozinho quando o pagamento é confirmado. Você também recebe lembretes por e-mail e WhatsApp 2 dias antes, no dia e depois do vencimento. Se já pagou e o aviso continua, espere alguns minutos: a confirmação depende do banco.",
      },
      {
        heading: "Reajuste anual",
        body: "Todo mês de julho a mensalidade é reajustada por índices de inflação (IPCA/IGPM). O aviso formal chega com 30 dias de antecedência pela plataforma.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Suas mensalidades",
        text: "Todas as parcelas do seu plano ficam nesta lista, da mais recente para as anteriores.",
      },
      {
        id: "list",
        target: "student-payments.list",
        title: "Cada parcela",
        text: "Valor, vencimento e situação. Parcelas em aberto abrem ao toque e mostram o pagamento; as pagas trazem o botão de recibo.",
      },
      {
        id: "pix",
        target: "student-payments.list",
        title: "Pagando com PIX",
        text: "Abra a parcela em aberto e use o QR Code ou Copiar Código. Pague sempre por este código: PIX enviado para outra chave não dá baixa automática.",
      },
      {
        id: "verify",
        target: "student-payments.list",
        title: "Já paguei e continua em aberto",
        text: "Use Já paguei, verificar pagamento para consultar o banco de novo. Em parcela vencida, Gerar novo PIX cria um código válido, porque o antigo expira.",
      },
    ],
  },

  "/hub/student/contract": {
    title: "Seu Contrato",
    summary:
      "O contrato da sua matrícula: onde ler, assinar digitalmente e baixar o PDF.",
    docsArticleId: "aluno-contrato",
    sections: [
      {
        heading: "O que fica nesta tela",
        body: "O contrato de prestação de serviços da sua matrícula, com a validade e a situação atual: Contrato Ativo, Assinatura Pendente ou Contrato Expirado. Faltando pouco para expirar, um aviso mostra em quantos dias.",
      },
      {
        heading: "Os botões",
        body: [
          "Baixar PDF salva uma cópia do contrato no seu aparelho.",
          "Receber por E-mail envia o PDF para o e-mail da sua conta.",
          "Havendo assinatura pendente, a tela mostra os termos e o botão para assinar digitalmente.",
        ],
      },
      {
        heading: "Recesso pedagógico de fim de ano",
        body: "A escola tem recesso obrigatório nas duas últimas semanas de dezembro e nas duas primeiras de janeiro. As aulas ao vivo param, mas as mensalidades seguem integrais, sem desconto. Você pode optar por receber atividades para fazer no seu tempo durante o período.",
      },
      {
        heading: "Cancelar antes do fim do contrato",
        body: "Encerrar a matrícula no meio do prazo exige aviso de 15 dias úteis e tem taxa de rescisão de 50% do valor da mensalidade seguinte. Em caso de rescisão por indisciplina, o desligamento é imediato.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Seu contrato",
        text: "Aqui fica o contrato da sua matrícula, para ler, assinar e guardar.",
      },
      {
        id: "status",
        target: "student-contract.status",
        title: "Situação e validade",
        text: "Mostra se o contrato está ativo, esperando sua assinatura ou expirado, e até quando ele vale. Perto do fim, um aviso indica quantos dias restam.",
      },
      {
        id: "actions",
        target: "student-contract.actions",
        title: "Baixar e receber por e-mail",
        text: "Baixar PDF salva a cópia no seu aparelho. Receber por E-mail manda o arquivo para o e-mail da sua conta — útil para guardar fora da plataforma.",
      },
      {
        id: "rules",
        title: "Duas regras que costumam surpreender",
        text: "O recesso de fim de ano (duas últimas semanas de dezembro e duas primeiras de janeiro) suspende as aulas mas não a mensalidade. E cancelar no meio do contrato exige aviso de 15 dias úteis e tem taxa de 50% da mensalidade seguinte.",
      },
    ],
  },

  "/hub/student/courses": {
    title: "Cursos",
    summary: "Os cursos em vídeo liberados para você, para estudar no seu ritmo.",
    docsArticleId: "aluno-cursos",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Os cursos gravados que a escola liberou para você, cada um com o quanto você já assistiu. Abra um curso para ver as seções e as lições.",
      },
      {
        heading: "Seu progresso é salvo",
        body: "Você pode parar no meio de uma lição e continuar depois de onde estava, inclusive em outro aparelho. Nada precisa ser marcado à mão para isso funcionar.",
      },
      {
        heading: "Não achou um curso que esperava?",
        body: "A liberação dos cursos é feita pela escola conforme seu plano e seu momento no curso. Se algo parece faltando, fale com seu professor ou com a secretaria.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Seus cursos em vídeo",
        text: "Conteúdo gravado para você estudar quando quiser, além das aulas com o professor.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "A lista de cursos",
        text: "Cada cartão é um curso liberado para você, com o progresso que você já fez. Toque para abrir e começar a assistir.",
      },
      {
        id: "progress",
        title: "Pode parar no meio",
        text: "Seu progresso é salvo automaticamente, então dá para continuar depois — até em outro aparelho.",
      },
    ],
  },

  "/hub/student/courses/[id]": {
    title: "Assistindo ao curso",
    summary:
      "O player do curso: o vídeo da lição, o menu de lições e os quizzes de cada etapa.",
    docsArticleId: "aluno-cursos",
    sections: [
      {
        heading: "Como a tela se organiza",
        body: "O conteúdo da lição fica no centro e a lista de lições no menu lateral, agrupada por seção. As lições concluídas aparecem marcadas. No celular, use o botão Menu para abrir e fechar essa lista.",
      },
      {
        heading: "Os botões",
        body: [
          "Marcar como concluída registra a lição como feita e atualiza sua barra de progresso.",
          "Anterior e Próxima andam entre as lições na ordem do curso.",
          "Menu abre a lista de lições no celular.",
        ],
      },
      {
        heading: "Quizzes",
        body: "Algumas lições terminam com um quiz. Finalizar Quiz corrige e mostra quantas questões você acertou; Praticar Novamente refaz o quiz quantas vezes você quiser. Sua última tentativa fica salva.",
      },
      {
        heading: "Aqui o menu lateral não aparece",
        body: "Para você assistir sem distração, o menu da plataforma fica escondido nesta tela. Use o botão de voltar do topo para sair do curso.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O player do curso",
        text: "Esta é a tela de estudo. Vamos ver o conteúdo, o menu de lições e como marcar seu progresso.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "A lição",
        text: "Vídeo, texto ou os dois, conforme a lição. Quando ela não tem conteúdo publicado ainda, a tela avisa.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "As lições do curso",
        text: "A lista completa, agrupada por seção, com as concluídas marcadas. Toque em qualquer lição para pular direto para ela.",
      },
      {
        id: "complete",
        target: "student-course-player.complete",
        title: "Marcar como concluída",
        text: "Registra a lição como feita e atualiza sua barra de progresso. Anterior e Próxima seguem a ordem do curso.",
      },
    ],
  },

  "/hub/student/practice": {
    title: "Prática Diária",
    summary:
      "Sua trilha de exercícios que se ajusta ao seu nível, mais o roteiro de lições e o histórico.",
    docsArticleId: "aluno-pratica",
    sections: [
      {
        heading: "As três abas",
        body: [
          "Prática traz sua trilha do plano atual, dia por dia, e é por onde você começa a sessão de hoje.",
          "Roteiro mostra a jornada de lições que seu professor programou para você.",
          "Histórico guarda os planos que você já concluiu.",
        ],
      },
      {
        heading: "Como a prática se ajusta a você",
        body: "Os exercícios são curtos e levam em conta seu nível e o que você errou nas últimas sessões. Cada sessão concluída rende XP e alimenta seu roteiro.",
      },
      {
        heading: "Refazer um dia já feito",
        body: "Dias concluídos podem ser refeitos gastando XP. A tela mostra seu saldo, o custo do replay e como fica o saldo depois — e avisa quando o XP não é suficiente.",
      },
      {
        heading: "Constância vence intensidade",
        body: "Poucos minutos todos os dias funcionam melhor que uma maratona no fim de semana. A plataforma pode te lembrar por notificação; isso se ajusta na aba Notificações das Configurações.",
      },
      {
        heading: "Sem plano ativo?",
        body: "A trilha só existe depois que seu professor monta seu plano de estudos. Se a tela está vazia, fale com ele.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua prática diária",
        text: "Exercícios curtos, feitos para o seu nível, que reforçam justamente o que você ainda não fixou.",
      },
      {
        id: "xp",
        target: "student-practice.xp",
        title: "XP e ofensiva",
        text: "Seu XP acumulado e os dias seguidos de prática. O XP também é a moeda para refazer um dia já concluído.",
      },
      {
        id: "tabs",
        target: "student-practice.tabs",
        title: "As três abas",
        text: "Prática é sua trilha de hoje. Roteiro é a jornada de lições que seu professor programou. Histórico guarda os planos concluídos.",
      },
      {
        id: "path",
        target: "student-practice.path",
        title: "A trilha",
        text: "Cada nó é um dia do plano. O marcado como HOJE é a sua sessão de agora; os anteriores podem ser refeitos gastando XP, e os da frente abrem conforme você avança.",
      },
      {
        id: "rhythm",
        title: "Todo dia um pouco",
        text: "Poucos minutos por dia rendem mais que uma maratona. Se quiser um empurrão, ligue os lembretes na aba Notificações das Configurações.",
      },
    ],
  },

  "/hub/student/practice/session": {
    title: "Sessão de prática",
    summary:
      "A sessão de exercícios do dia: flashcards, lacunas, áudio, quiz e frases para ordenar.",
    docsArticleId: "aluno-pratica",
    sections: [
      {
        heading: "Os tipos de exercício",
        body: [
          "Flashcard mostra a palavra de um lado e o significado do outro, com áudio da pronúncia.",
          "Complete a lacuna pede a palavra que falta na frase.",
          "Escuta e escolha toca um áudio e pede a alternativa certa.",
          "Quiz é pergunta com alternativas.",
          "Ordenar frase pede para colocar as palavras na ordem correta.",
        ],
      },
      {
        heading: "Retorno a cada resposta",
        body: "Depois de cada resposta você vê na hora se acertou, com a solução correta quando erra. Errar não é problema: é justamente o que diz à trilha o que precisa voltar mais vezes.",
      },
      {
        heading: "Sair no meio",
        body: "O botão de sair pede confirmação antes, para você não perder a sessão por um toque errado.",
      },
      {
        heading: "Ao terminar",
        body: "O resumo mostra seus acertos e o XP ganho na sessão, e a trilha marca o dia como concluído.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua sessão de hoje",
        text: "Alguns exercícios curtos, de tipos variados. Vamos ver a tela.",
      },
      {
        id: "progress",
        target: "practice-session.progress",
        title: "Onde você está na sessão",
        text: "A barra do topo mostra quanto falta e o botão de sair, que sempre pede confirmação antes.",
      },
      {
        id: "exercise",
        target: "practice-session.exercise",
        title: "O exercício",
        text: "Pode ser flashcard, lacuna, áudio, quiz ou ordenar frase. Nos que têm som, o botão de ouvir repete quantas vezes você quiser.",
      },
      {
        id: "feedback",
        title: "Errar faz parte",
        text: "Depois de cada resposta você vê o resultado e a solução correta. O que você erra volta com mais frequência nas próximas sessões — é assim que a trilha se ajusta a você.",
      },
    ],
  },

  "/hub/student/immersion": {
    title: "Minha Imersão",
    summary:
      "Jogos e atividades livres para praticar sozinho, de um jeito leve.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "O que tem aqui",
        body: [
          "Wordle: adivinhe a palavra do dia. Trabalha vocabulário e ortografia.",
          "Lyrics: complete as letras de músicas enquanto ouve. Treina compreensão auditiva.",
          "Word Ladder: transforme uma palavra em outra trocando uma letra por vez.",
          "Podcasts e Blog aparecem marcados como Em breve — ainda não estão liberados.",
        ],
      },
      {
        heading: "São atividades livres",
        body: "Não valem nota e não substituem a prática diária nem as aulas. Servem para manter contato com o idioma sem peso.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Praticar brincando",
        text: "Esta área reúne jogos para você manter contato com o idioma fora das aulas. Nada aqui vale nota.",
      },
      {
        id: "activities",
        target: "student-immersion.activities",
        title: "As atividades",
        text: "Wordle treina vocabulário e ortografia. Lyrics treina escuta com música. Word Ladder muda uma palavra em outra, uma letra por vez. Toque em qualquer uma para começar.",
      },
      {
        id: "soon",
        title: "Em breve",
        text: "Podcasts e Blog aparecem na lista marcados como Em breve. Eles ainda não abrem — estão ali para você saber que vêm.",
      },
    ],
  },

  "/hub/student/immersion/wordle": {
    title: "Wordle",
    summary: "Adivinhe a palavra do dia em até seis tentativas.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "Como jogar",
        body: "Digite uma palavra do tamanho indicado e confirme. As letras mudam de cor: na posição certa, presente na palavra mas em outro lugar, ou fora da palavra. Use essas dicas para chegar à resposta.",
      },
      {
        heading: "Os controles",
        body: [
          "O teclado da tela funciona junto com o teclado do aparelho, e vai guardando as cores das letras já testadas.",
          "O seletor de idioma escolhe em que língua você joga.",
          "O ícone de histórico mostra as palavras dos dias anteriores.",
          "Terminada a rodada, toque em qualquer palavra aprendida para ver significado, pronúncia e exemplo.",
        ],
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A palavra do dia",
        text: "Descubra a palavra usando as cores como pistas. Uma palavra nova por dia.",
      },
      {
        id: "board",
        target: "immersion-wordle.board",
        title: "O tabuleiro",
        text: "Cada linha é uma tentativa. Depois de confirmar, as cores dizem quais letras estão na posição certa, quais existem em outro lugar e quais não estão na palavra.",
      },
      {
        id: "keyboard",
        target: "immersion-wordle.keyboard",
        title: "O teclado",
        text: "Funciona junto com o teclado do seu aparelho e guarda as cores das letras que você já testou — dá para consultar sem lembrar de cabeça.",
      },
      {
        id: "extras",
        target: "immersion-wordle.toolbar",
        title: "Idioma e histórico",
        text: "Troque o idioma do jogo no seletor e veja as palavras dos dias anteriores no histórico. Ao fim da rodada, toque numa palavra para ver significado e pronúncia.",
      },
    ],
  },

  "/hub/student/immersion/lyrics": {
    title: "Lyrics Training",
    summary:
      "Complete a letra da música enquanto ela toca, treinando sua compreensão auditiva.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "Como jogar",
        body: "Escolha uma música pela busca, por nome ou artista. A música toca e você digita as palavras que faltam na letra, frase por frase.",
      },
      {
        heading: "Antes de começar",
        body: [
          "A busca aceita nome da música ou do artista.",
          "Confirme música e artista nos dois campos abaixo da busca.",
          "Pausar a cada escolhe se a música para a cada 1 linha ou a cada 2 linhas — 1 linha é mais fácil.",
          "Iniciar começa a tocar. Sem isso o jogo espera.",
        ],
      },
      {
        heading: "Durante o jogo",
        body: [
          "O botão de play e pause controla a música.",
          "Repetir frase toca o trecho atual de novo, quantas vezes você precisar.",
          "Dica revela parte da palavra quando você travar.",
          "Trocar música volta ao começo para escolher outra.",
        ],
      },
      {
        heading: "Dica de uso",
        body: "Música conhecida no começo ajuda: você já tem a melodia na cabeça e sobra atenção para as palavras.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Treinar escuta com música",
        text: "A música toca e você completa a letra. É o exercício mais próximo de ouvir o idioma na vida real.",
      },
      {
        id: "search",
        target: "immersion-lyrics.search",
        title: "Escolher a música",
        text: "Busque por nome da música ou do artista e confirme nos campos abaixo. Comece por algo que você já conhece: com a melodia na cabeça, sobra atenção para as palavras.",
      },
      {
        id: "pause-every",
        target: "immersion-lyrics.search",
        title: "Pausar a cada",
        text: "Escolha se a música para a cada 1 linha ou a cada 2 linhas. Comece com 1 linha: dá mais tempo para ouvir e digitar. Depois toque em Iniciar.",
      },
      {
        id: "game",
        target: "immersion-lyrics.game",
        title: "Completar a letra",
        text: "Digite as palavras que faltam conforme a música avança. Repetir frase toca o trecho de novo, Dica revela parte da palavra e Trocar música volta ao começo.",
      },
    ],
  },

  "/hub/student/immersion/word-ladder": {
    title: "Word Ladder",
    summary:
      "Transforme uma palavra em outra trocando uma letra por vez, sempre formando palavras válidas.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "Como jogar",
        body: "Você recebe a palavra de partida e a de chegada. Cada passo troca uma única letra, e o resultado precisa ser uma palavra que existe. O jogo mostra quando o passo não vale.",
      },
      {
        heading: "Os controles",
        body: [
          "O teclado da tela funciona junto com o do aparelho.",
          "Desfazer volta um passo.",
          "O botão de opções ajusta a dificuldade e o que o jogo mostra.",
          "O seletor de idioma escolhe em que língua você joga.",
          "Toque em qualquer palavra do caminho para ver significado e pronúncia.",
        ],
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Uma letra por vez",
        text: "Saia da palavra de partida e chegue na de destino trocando uma letra em cada passo — e cada passo tem de ser uma palavra de verdade.",
      },
      {
        id: "board",
        target: "immersion-word-ladder.board",
        title: "O caminho",
        text: "Cada linha é um passo seu. O jogo avisa quando a troca não forma uma palavra válida, então dá para tentar sem medo.",
      },
      {
        id: "controls",
        target: "immersion-word-ladder.toolbar",
        title: "Desfazer, opções e idioma",
        text: "Desfazer volta um passo. Nas opções você ajusta a dificuldade e o que aparece na tela. O seletor troca o idioma do jogo.",
      },
      {
        id: "learn",
        title: "Aproveite o vocabulário",
        text: "Toque em qualquer palavra do caminho para ver significado, pronúncia e exemplo. É onde o jogo virou estudo.",
      },
    ],
  },

  "/hub/student/recess/[slotId]": {
    title: "Atividade de Recesso",
    summary:
      "A atividade que substitui a aula quando seu professor está em recesso.",
    sections: [
      {
        heading: "Por que esta tela existe",
        body: "Quando seu professor entra em recesso, a aula do período não acontece — mas seu cronograma não para. Esta atividade ocupa o lugar do encontro, para você seguir estudando.",
      },
      {
        heading: "Como a tela se organiza",
        body: "O conteúdo da lição fica do lado maior, para leitura. Praticar e Testar, do outro lado, traz o quiz da atividade quando existe um.",
      },
      {
        heading: "O quiz",
        body: "Responda as perguntas e, ao terminar, a tela mostra quantas você acertou. Tentar Novamente reinicia o quiz quantas vezes você quiser — não existe limite nem nota valendo.",
      },
      {
        heading: "Sem conteúdo ou sem quiz?",
        body: "Algumas atividades têm só texto, outras só quiz. A tela avisa quando uma das partes não foi cadastrada — não é erro seu.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Atividade no lugar da aula",
        text: "Seu professor está em recesso neste período. Esta atividade mantém seu cronograma andando até a volta das aulas.",
      },
      {
        id: "content",
        target: "student-recess.content",
        title: "O conteúdo",
        text: "A lição para ler, no seu tempo. Se a atividade não tiver texto cadastrado, a tela avisa aqui.",
      },
      {
        id: "quiz",
        target: "student-recess.quiz",
        title: "Praticar e Testar",
        text: "O quiz da atividade. Ao terminar, você vê quantas acertou, e Tentar Novamente reinicia sem limite — aqui nada vale nota.",
      },
    ],
  },

  "/hub/student/docs": {
    title: "Central de Ajuda",
    summary:
      "O guia completo da plataforma para alunos, com busca e uma área para perguntar.",
    sections: [
      {
        heading: "O que tem aqui",
        body: "Os guias completos, organizados por assunto: começando, aulas e calendário, pagamentos, estudos e prática, conta e configurações, e problemas comuns. É a versão longa do que o (?) de cada página resume.",
      },
      {
        heading: "Como achar o que precisa",
        body: "Use a busca no topo: ela procura em todo o texto dos artigos, não só nos títulos. Vale buscar pelo problema em palavras suas — por exemplo, minha aula sumiu ou não consigo entrar.",
      },
      {
        heading: "Não achou a resposta?",
        body: "Dá para enviar sua pergunta. Ela chega à escola, e as perguntas que aparecem com frequência viram artigo novo aqui.",
      },
      {
        heading: "Ajuda da página onde você está",
        body: "Para uma explicação curta da tela em que você está, sem sair dela, use o (?) no topo de qualquer página.",
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
        text: "Procura dentro de todo o texto dos artigos, não só nos títulos. Descreva o problema com suas palavras, como minha aula sumiu.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "Os assuntos",
        text: "Os guias agrupados por tema: começando, aulas e calendário, pagamentos, estudos, conta e problemas comuns.",
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
