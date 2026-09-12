import type { DocSection } from "./docs.types";

/**
 * Central de Ajuda do Aluno.
 *
 * Escrita na segunda pessoa, falando direto com o aluno — este conteúdo é lido
 * tanto por ele quanto por professores e admins que precisam orientá-lo.
 */
export const STUDENT_DOCS: DocSection[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-inicio",
    title: "Começando",
    description: "Seu primeiro acesso e o que existe em cada área.",
    icon: "Compass",
    articles: [
      {
        id: "aluno-primeiro-acesso",
        title: "Primeiro acesso",
        summary: "Como entrar pela primeira vez e criar sua senha.",
        keywords: ["entrar", "login", "senha", "convite", "acesso", "cadastro"],
        blocks: [
          {
            type: "steps",
            items: [
              "Você recebe um convite por e-mail e por WhatsApp assim que sua matrícula é criada.",
              "Clique no link do convite — ele leva a uma página onde você define sua própria senha.",
              "Escolha uma senha só sua. A escola nunca cadastra nem tem acesso à sua senha.",
              "Pronto: use seu e-mail e essa senha para entrar sempre que quiser.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "O link expirou?",
            text: "O convite tem prazo de validade. Se ele parou de funcionar, fale com a secretaria pedindo um novo convite — não é preciso refazer a matrícula.",
          },
          {
            type: "note",
            variant: "info",
            title: "Não achou o e-mail",
            text: "Confira a caixa de spam ou promoções. O convite também chega no seu WhatsApp, se você cadastrou telefone.",
          },
        ],
      },
      {
        id: "aluno-visao-geral",
        title: "O que tem em cada área",
        summary: "Um mapa rápido do menu lateral.",
        keywords: ["menu", "navegação", "áreas", "mapa", "onde fica"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Meu Perfil", does: "Seus dados, foto e informações de contato." },
              { name: "Caderno", does: "As anotações de todas as suas aulas, organizadas por data." },
              { name: "Calendário", does: "Suas aulas agendadas — é aqui que você cancela ou remarca." },
              { name: "Cursos", does: "Os cursos em vídeo liberados para você." },
              { name: "Imersão", does: "Jogos e atividades para praticar sozinho: Wordle, Lyrics e Word Ladder." },
              { name: "Configurações", does: "Senha, notificações, idioma e tema da plataforma." },
            ],
          },
          {
            type: "p",
            text: "Além do menu, você tem as páginas de **Pagamentos**, **Nivelamento** e **Prática Diária**, que aparecem conforme o seu plano e o seu momento no curso.",
          },
        ],
      },
      {
        id: "aluno-app",
        title: "Instalar como aplicativo",
        summary: "Deixe a plataforma na tela inicial do celular.",
        keywords: ["app", "aplicativo", "instalar", "celular", "pwa", "atalho"],
        blocks: [
          {
            type: "p",
            text: "A plataforma pode ser instalada como aplicativo no celular ou no computador — abre mais rápido, ocupa a tela inteira e permite receber avisos de aula.",
          },
          {
            type: "bullets",
            items: [
              "**Android/Chrome:** toque no menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.",
              "**iPhone/Safari:** toque no botão de compartilhar e escolha “Adicionar à Tela de Início”.",
              "**Computador:** clique no ícone de instalar na barra de endereço do navegador.",
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-aulas",
    title: "Aulas e Calendário",
    description: "Agendar, cancelar, remarcar e entender os créditos.",
    icon: "CalendarDays",
    articles: [
      {
        id: "aluno-calendario",
        title: "Seu calendário de aulas",
        summary: "Onde ver suas próximas aulas e regras de tolerância de atraso.",
        route: "/hub/student/schedule",
        keywords: ["agenda", "calendário", "aula", "horário", "videochamada", "entrar", "atraso"],
        blocks: [
          {
            type: "p",
            text: "O calendário mostra todas as suas aulas agendadas. Clique em uma aula para ver os detalhes, entrar na videochamada no horário, cancelar ou remarcar.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Tolerância de Atraso",
            text: "Será tolerado um atraso máximo de até **15 minutos** para o início da aula. Excedido este prazo, o professor não estará mais obrigado a aguardar, sendo a aula considerada ministrada, faturada e sem direito a reposição.",
          },
          {
            type: "table",
            title: "O que cada status significa",
            headers: ["Status", "Significa"],
            rows: [
              ["Agendada", "Está confirmada e vai acontecer no horário marcado."],
              ["Concluída", "A aula aconteceu e foi registrada pelo professor."],
              ["Cancelada por você", "Você cancelou dentro do prazo permitido."],
              ["Cancelada pelo professor", "O professor precisou cancelar. Você recebe um crédito de reposição."],
              ["Falta", "A aula não aconteceu, você cancelou fora do prazo ou se atrasou além da tolerância. Conta como aula dada."],
              ["Recesso do professor", "Período de descanso avisado pelo professor. Você receberá uma atividade ou aula gravada para substituir o encontro e não interromper o cronograma."],
            ],
          },
        ],
      },
      {
        id: "aluno-cancelar",
        title: "Cancelar uma aula",
        summary: "A regra das 4 horas e o que acontece se você avisar em cima da hora.",
        route: "/hub/student/schedule",
        keywords: ["cancelar", "desmarcar", "faltar", "4 horas", "antecedência", "falta"],
        blocks: [
          {
            type: "p",
            text: "Você pode cancelar uma aula pelo calendário, clicando nela e escolhendo cancelar. O que muda é **quando** você faz isso.",
          },
          {
            type: "note",
            variant: "warning",
            title: "A regra das 4 horas",
            text: "Cancelando com **mais de 4 horas** de antecedência, a aula é registrada como cancelamento normal. Com **menos de 4 horas**, ela é registrada como **falta** — e falta conta como aula dada, sem reposição.",
          },
          {
            type: "note",
            variant: "info",
            title: "Imprevisto de verdade?",
            text: "A regra é automática, mas a escola é feita de gente. Se aconteceu algo sério, fale com a secretaria — a decisão é dela, não do sistema.",
          },
        ],
      },
      {
        id: "aluno-remarcar",
        title: "Remarcar uma aula",
        summary: "Como escolher outro horário e quantas vezes você pode fazer isso por mês.",
        route: "/hub/student/schedule",
        keywords: ["remarcar", "reagendar", "trocar horário", "mudar aula", "limite"],
        blocks: [
          {
            type: "steps",
            items: [
              "Abra a aula no calendário e escolha remarcar.",
              "O sistema mostra os horários livres do seu professor.",
              "Escolha o novo horário e confirme.",
              "A aula antiga é liberada e a nova entra no seu calendário.",
            ],
          },
          {
            type: "bullets",
            items: [
              "**Limite:** você pode remarcar até **2 aulas por mês civil**. Essas aulas não são cumulativas para os meses seguintes.",
              "**Prazo:** é preciso remarcar com pelo menos **4 horas** de antecedência. Passou disso, só dá para cancelar (e contar como falta).",
              "**Só aulas agendadas:** aulas já concluídas, canceladas ou com falta não podem ser remarcadas.",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Aula que o professor cancelou é diferente",
            text: "Quando o professor cancela, você ganha um **crédito de reposição** e remarca usando esse crédito — não gasta uma das suas 2 remarcações do mês.",
          },
        ],
      },
      {
        id: "aluno-creditos",
        title: "Créditos de reposição",
        summary: "O que são, de onde vêm e por que eles vencem.",
        route: "/hub/student/schedule",
        keywords: ["crédito", "reposição", "bônus", "aula extra", "vencimento", "expira"],
        blocks: [
          {
            type: "p",
            text: "Crédito é o direito a uma aula extra. Ele aparece no seu calendário e é usado na hora de agendar uma reposição.",
          },
          {
            type: "fields",
            title: "De onde vêm os créditos",
            items: [
              { name: "Cancelamento do professor", does: "Sempre que o professor cancela uma aula sua, o crédito é gerado automaticamente." },
              { name: "Bônus", does: "Concedido pela escola em situações específicas — promoções, compensações combinadas." },
              { name: "Atraso da escola", does: "Quando houve algum problema do nosso lado que prejudicou sua aula." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Créditos vencem",
            text: "Todo crédito tem data de validade. Depois dela, ele deixa de existir e não é possível recuperá-lo. Agende sua reposição assim que puder.",
          },
          {
            type: "note",
            variant: "danger",
            title: "Cuidado ao cancelar uma reposição",
            text: "Se você cancelar uma aula que foi agendada com crédito, **o crédito é consumido do mesmo jeito**. Na prática, você perde a reposição.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-pagamentos",
    title: "Pagamentos",
    description: "Suas mensalidades, PIX e o que fazer em caso de atraso.",
    icon: "Wallet",
    articles: [
      {
        id: "aluno-mensalidades",
        title: "Ver e pagar suas mensalidades",
        summary: "Onde encontrar o PIX de cada parcela.",
        route: "/hub/student/payments",
        keywords: ["pagar", "mensalidade", "pix", "parcela", "fatura", "boleto", "cobrança"],
        blocks: [
          {
            type: "p",
            text: "A página de Pagamentos lista todas as parcelas do seu plano, com valor, vencimento e situação. A parcela em aberto traz o QR Code e o código copia e cola do PIX. O vencimento ocorre sempre entre os dias 1º e 10º de cada mês.",
          },
          {
            type: "steps",
            title: "Como pagar",
            items: [
              "Abra a parcela em aberto.",
              "Escaneie o QR Code pelo app do seu banco ou toque em copiar o código PIX.",
              "Cole no seu banco, confira o valor e confirme o pagamento.",
              "A baixa é automática e acontece em poucos minutos.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Pague sempre pelo PIX da plataforma",
            text: "Pagamentos feitos em outra chave PIX **não são reconhecidos automaticamente** e sua parcela continua em aberto até alguém conferir na mão. Use sempre o código gerado aqui.",
          },
          {
            type: "note",
            variant: "info",
            title: "Reajuste Anual",
            text: "Todo mês de julho a mensalidade é reajustada com base em índices de inflação (IPCA/IGPM). Você será avisado formalmente com 30 dias de antecedência pela plataforma.",
          },
        ],
      },
      {
        id: "aluno-atraso",
        title: "Mensalidade em atraso",
        summary: "O que muda na plataforma quando uma parcela vence.",
        keywords: ["atraso", "vencido", "bloqueado", "aviso", "faixa vermelha", "devendo"],
        blocks: [
          {
            type: "p",
            text: "Ao vencer uma parcela, aparece um aviso fixo no topo da plataforma. Ele é um lembrete, e some sozinho assim que o pagamento é confirmado.",
          },
          {
            type: "bullets",
            items: [
              "Você recebe lembretes automáticos por e-mail e WhatsApp: 2 dias antes, no dia e após o vencimento.",
              "Se já pagou e o aviso continua, aguarde alguns minutos — a confirmação depende do banco.",
              "Persistindo, fale com a secretaria informando data e valor do pagamento.",
            ],
          },
        ],
      },
      {
        id: "aluno-contrato",
        title: "Seu contrato e recessos",
        summary: "Onde ler o contrato, regras de recesso anual e quebras.",
        route: "/hub/student/contract",
        keywords: ["contrato", "assinar", "pdf", "documento", "termos", "férias", "recesso"],
        blocks: [
          {
            type: "p",
            text: "Aqui fica o contrato da sua matrícula. Se ainda não assinou, é nesta tela que você lê os termos e assina digitalmente. Depois de assinado, você pode baixar o PDF quando quiser.",
          },
          {
            type: "note",
            variant: "info",
            title: "Recesso Pedagógico de Fim de Ano",
            text: "A escola adota um recesso anual obrigatório durante as **duas últimas semanas de dezembro e as duas primeiras de janeiro**. As aulas ao vivo são suspensas, mas as **mensalidades devem ser pagas de forma integral**, sem descontos. Você poderá optar por receber atividades assíncronas no período.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Cancelamento antes do fim",
            text: "Encerrando a matrícula no meio do prazo contratual (exige aviso de 15 dias úteis), há uma taxa de rescisão compensatória de **50% do valor total da mensalidade subsequente**. Em caso de rescisão por indisciplina, o desligamento é imediato.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-estudos",
    title: "Estudos e Prática",
    description: "Caderno, cursos, nivelamento, prática diária e imersão.",
    icon: "GraduationCap",
    articles: [
      {
        id: "aluno-caderno",
        title: "Caderno",
        summary: "As anotações das suas aulas, sempre à mão.",
        route: "/hub/student/notebook",
        keywords: ["caderno", "anotações", "notas", "aula", "revisar", "conteúdo"],
        blocks: [
          {
            type: "p",
            text: "Cada aula gera uma página no seu caderno, com o que foi trabalhado, exemplos e observações do professor. É o melhor lugar para revisar antes da próxima aula.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Anexos têm prazo",
            text: "Arquivos e imagens anexados às aulas ficam disponíveis por um período e depois são removidos automaticamente. Se algum material for importante para você, baixe e guarde.",
          },
        ],
      },
      {
        id: "aluno-chamada",
        title: "Chamada de vídeo com o professor",
        summary: "Como a chamada aparece, o compartilhamento de tela e o que fazer se você sair sem querer.",
        keywords: ["chamada", "videochamada", "vídeo", "entrar na aula", "compartilhar tela", "cancelei"],
        blocks: [
          {
            type: "p",
            text: "Quando seu professor inicia a aula, um painel de chamada aparece automaticamente para você — na página do caderno ou em qualquer outra tela em que você estiver navegando na plataforma. Clique em **Entrar na Aula** para participar.",
          },
          {
            type: "note",
            variant: "info",
            title: "Pode continuar navegando",
            text: "Precisa checar o calendário ou outra parte da plataforma no meio da aula? Pode navegar à vontade — a chamada continua ativa num painel flutuante, sem cair.",
          },
          {
            type: "p",
            text: "**Compartilhamento de tela:** quando o professor compartilha a tela, aparece um botão **Expandir** sobre o conteúdo — clique para ver em tamanho grande.",
          },
          {
            type: "note",
            variant: "success",
            title: "Cancelou sem querer ou caiu a internet?",
            text: "A aula não termina por isso. Enquanto o professor não encerrar, você consegue entrar de novo a qualquer momento: procure o aviso **Chamada ativa — entrar** na barra lateral (ou o ícone flutuante, se estiver pelo celular).",
          },
        ],
      },
      {
        id: "aluno-cursos",
        title: "Cursos em vídeo",
        summary: "Conteúdo gravado para estudar no seu ritmo.",
        route: "/hub/student/courses",
        keywords: ["curso", "vídeo", "aula gravada", "módulo", "progresso", "assistir"],
        blocks: [
          {
            type: "p",
            text: "Os cursos são organizados em seções e lições. Seu progresso é salvo automaticamente, então dá para parar no meio e continuar depois de onde você estava — inclusive em outro aparelho.",
          },
        ],
      },
      {
        id: "aluno-nivelamento",
        title: "Nivelamento",
        summary: "Descubra seu nível atual e acompanhe sua evolução.",
        route: "/hub/student/placement",
        keywords: ["nivelamento", "nível", "teste", "placement", "avaliação", "a1", "b2"],
        blocks: [
          {
            type: "p",
            text: "O teste de nivelamento mede onde você está no idioma. O resultado orienta o professor no planejamento das aulas e serve de marco para você acompanhar sua evolução ao longo do curso.",
          },
          {
            type: "note",
            variant: "info",
            title: "Não é prova",
            text: "Não existe nota boa ou ruim aqui — existe ponto de partida. Responda com sinceridade e sem consultar nada: um resultado inflado só atrapalha o planejamento das suas aulas.",
          },
        ],
      },
      {
        id: "aluno-pratica",
        title: "Prática diária",
        summary: "Sua trilha adaptativa de estudos e o roteiro de evolução.",
        route: "/hub/student/practice",
        keywords: ["prática", "trilha", "xp", "roteiro", "estudar", "diária", "streak"],
        blocks: [
          {
            type: "p",
            text: "A prática diária propõe exercícios curtos que se ajustam ao seu nível e ao que você errou nas últimas sessões. Cada sessão concluída rende XP e alimenta o seu roteiro de estudos.",
          },
          {
            type: "note",
            variant: "success",
            title: "Constância vence intensidade",
            text: "Poucos minutos todos os dias funcionam melhor do que uma maratona no fim de semana. A plataforma te lembra por notificação — dá para ajustar isso em Configurações.",
          },
        ],
      },
      {
        id: "aluno-imersao",
        title: "Imersão: jogos e atividades",
        summary: "Wordle, Lyrics e Word Ladder para praticar sozinho.",
        route: "/hub/student/immersion",
        keywords: ["imersão", "jogo", "wordle", "lyrics", "música", "word ladder", "diversão"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Wordle", does: "Adivinhe a palavra do dia. Trabalha vocabulário e ortografia." },
              { name: "Lyrics", does: "Complete as letras de músicas enquanto ouve. Treina compreensão auditiva." },
              { name: "Word Ladder", does: "Transforme uma palavra em outra trocando uma letra por vez." },
            ],
          },
          {
            type: "p",
            text: "São atividades livres: não valem nota e não substituem a prática diária. Servem para manter contato com o idioma de um jeito leve.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-conta",
    title: "Conta e Configurações",
    description: "Senha, notificações, dados pessoais e privacidade.",
    icon: "Settings",
    articles: [
      {
        id: "aluno-configuracoes",
        title: "Configurações da conta",
        summary: "Senha, notificações, idioma e aparência.",
        route: "/hub/student/settings",
        keywords: ["senha", "notificação", "idioma", "tema", "escuro", "configuração"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Conta", does: "Nome, e-mail, foto e idioma da plataforma." },
              { name: "Segurança", does: "Trocar senha e ativar a verificação em duas etapas." },
              { name: "Notificações", does: "Escolher quais avisos receber e por quais canais (e-mail, WhatsApp, push)." },
              { name: "Aparência", does: "Tema claro ou escuro." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Cuidado ao desligar avisos",
            text: "Desativar notificações de aula significa não receber o lembrete antes de cada encontro. Os avisos de pagamento continuam sendo enviados, por serem obrigações do contrato.",
          },
        ],
      },
      {
        id: "aluno-direitos-imagem",
        title: "Gravações e Direitos de Imagem",
        summary: "Regras sobre gravações de aulas e uso do material.",
        keywords: ["gravação", "gravar", "direitos", "material", "compartilhar", "proibido", "pirataria"],
        blocks: [
          {
            type: "p",
            text: "Para fins de controle de qualidade pedagógica, treinamento da equipe e segurança, as aulas transmitidas por videoconferência poderão ser gravadas pela escola, sob uso interno exclusivo.",
          },
          {
            type: "note",
            variant: "danger",
            title: "Proibição de Gravação e Compartilhamento",
            text: "Fica **terminantemente proibida** a gravação das videoconferências por parte do aluno, bem como a cópia ou distribuição do material didático fornecido. O descumprimento gera rescisão imediata por justa causa e responsabilização por perdas e danos.",
          },
        ],
      },
      {
        id: "aluno-dados",
        title: "Seus dados e privacidade",
        summary: "O que a escola guarda e quais são os seus direitos.",
        route: "/hub/student/settings",
        keywords: ["lgpd", "privacidade", "dados", "exportar", "excluir", "direitos"],
        blocks: [
          {
            type: "p",
            text: "Seus dados pessoais são armazenados de forma criptografada e só podem ser consultados por administradores, mediante confirmação de senha — e todo acesso fica registrado.",
          },
          {
            type: "bullets",
            items: [
              "**Exportar meus dados:** baixa uma cópia de tudo que a plataforma tem sobre você.",
              "**Excluir minha conta:** solicita a remoção definitiva dos seus dados.",
            ],
          },
          {
            type: "note",
            variant: "danger",
            title: "Exclusão é permanente",
            text: "Pedir exclusão apaga histórico de aulas, caderno e progresso — sem volta. Se você só quer pausar os estudos, fale com a secretaria sobre trancar a matrícula em vez de excluir a conta.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "aluno-problemas",
    title: "Problemas Comuns",
    description: "O que fazer quando algo não funciona.",
    icon: "LifeBuoy",
    articles: [
      {
        id: "aluno-nao-entro",
        title: "Não consigo entrar",
        summary: "Senha esquecida, conta inativa ou e-mail errado.",
        keywords: ["não entro", "esqueci a senha", "login", "bloqueado", "acesso negado"],
        blocks: [
          {
            type: "steps",
            items: [
              "Use “Esqueci minha senha” na tela de entrada — chega um link por e-mail para criar outra.",
              "Confira se está usando o mesmo e-mail que você informou na matrícula.",
              "Veja a caixa de spam: o e-mail de recuperação costuma cair lá.",
              "Se nada funcionar, fale com a secretaria — sua conta pode estar inativa.",
            ],
          },
        ],
      },
      {
        id: "aluno-videochamada",
        title: "A videochamada não funciona",
        summary: "Câmera, microfone e problemas de conexão.",
        keywords: ["câmera", "microfone", "áudio", "vídeo", "chamada", "não abre", "travando", "internet"],
        blocks: [
          {
            type: "steps",
            items: [
              "Autorize câmera e microfone quando o navegador pedir — sem isso a chamada não abre.",
              "Feche outros programas que usam a câmera (Zoom, Meet, Teams).",
              "Teste em outro navegador; Chrome costuma ser o mais estável.",
              "Se a imagem travar, desligue o vídeo e siga só com áudio: consome bem menos internet.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Responsabilidade pela conexão",
            text: "Conforme contrato, a escola **não se responsabiliza** pela qualidade técnica da aula decorrente de falhas em equipamentos, conexões de internet lentas ou instáveis por parte do aluno. Caso você não consiga participar por falha da sua internet, a aula será contabilizada como dada, sem direito a reposição.",
          },
          {
            type: "note",
            variant: "info",
            text: "Se nada resolver na hora da aula, avise seu professor pelo WhatsApp da escola para tentar receber alguma ajuda.",
          },
          {
            type: "note",
            variant: "success",
            title: "Saiu sem querer? Dá para voltar",
            text: "Se você cancelou a tela de entrada por engano ou a conexão caiu no meio da aula, a chamada continua ativa — procure o aviso **Chamada ativa — entrar** na barra lateral (ou o ícone flutuante no celular) para voltar, sem precisar que o professor reinicie nada.",
          },
        ],
      },
      {
        id: "aluno-aula-sumiu",
        title: "Minha aula sumiu do calendário",
        summary: "Por que uma aula pode deixar de aparecer.",
        keywords: ["sumiu", "desapareceu", "não aparece", "cancelada", "calendário vazio"],
        blocks: [
          {
            type: "bullets",
            items: [
              "Confira se você está olhando o mês certo — o calendário abre no mês atual.",
              "A aula pode ter sido cancelada pelo professor. Nesse caso você recebeu um aviso e um crédito de reposição.",
              "Se o professor entrou em recesso, as aulas do período aparecem marcadas como recesso.",
              "Não encontrando explicação, fale com a secretaria.",
            ],
          },
        ],
      },
    ],
  },
];