import type { DocSection } from "./docs.types";

/**
 * Conteúdo da Central de Ajuda do Admin.
 *
 * Cada artigo documenta uma tela real do hub: para que serve, o que cada
 * botão faz e qual fluxo o sistema dispara por trás. Ao alterar uma tela,
 * atualize o artigo correspondente aqui.
 */
export const ADMIN_DOCS: DocSection[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. PRIMEIROS PASSOS
  // ─────────────────────────────────────────────────────────────
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    description: "Como o hub está organizado e quem pode fazer o quê.",
    icon: "Compass",
    articles: [
      {
        id: "visao-geral",
        title: "Visão geral do Hub Admin",
        summary: "O mapa da plataforma: o que existe em cada área do menu lateral.",
        route: "/hub/admin/dashboard",
        keywords: ["início", "home", "menu", "navegação", "sidebar", "overview"],
        blocks: [
          {
            type: "p",
            text: "O hub do admin é dividido por área de responsabilidade. Cada item do menu lateral abre uma área independente, e quase toda ação relevante deixa rastro (log de auditoria, e-mail ou notificação para o usuário afetado).",
          },
          {
            type: "fields",
            title: "Áreas do menu",
            items: [
              { name: "Meu Perfil", does: "Seus próprios dados, foto e preferências." },
              { name: "Dashboard", does: "Indicadores do negócio: receita, alunos ativos, aulas, funil de onboarding." },
              { name: "Usuários", does: "Cadastro e gestão de alunos, professores, managers e admins." },
              { name: "Financeiro", does: "Transações, impostos, projeções e pacotes (planos) de assinatura." },
              { name: "Contratos", does: "Modelos de contrato, assinaturas e dados jurídicos da escola." },
              { name: "Cursos", does: "Catálogo de cursos, seções e lições publicadas para os alunos." },
              { name: "Meu Aprendizado", does: "Os cursos em que você mesmo está matriculado como aluno." },
              { name: "Conversas", does: "Caixa de entrada do WhatsApp — conversa direta com alunos." },
              { name: "Notificações", does: "Envio de push/in-app, templates de WhatsApp e histórico de e-mails." },
              { name: "Tarefas", does: "Gestor de tarefas e projetos internos da equipe." },
              { name: "Procedimentos", does: "POPs — procedimentos operacionais padrão escritos pela equipe." },
              { name: "Configurações", does: "Preferências da sua conta, segurança (2FA) e ajustes do sistema." },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Tudo aqui é restrito",
            text: "Toda rota sob `/hub/admin` exige sessão autenticada **com papel admin**. Um usuário de outro papel que tente abrir esses endereços é redirecionado automaticamente.",
          },
        ],
      },
      {
        id: "papeis-permissoes",
        title: "Papéis e permissões",
        summary: "Diferença entre admin, manager, professor e aluno — e o que cada um enxerga.",
        keywords: ["rbac", "cargo", "role", "acesso", "manager", "gerente", "permissão"],
        blocks: [
          {
            type: "p",
            text: "A plataforma usa controle de acesso por papel (RBAC). O papel define quais telas aparecem no menu e quais ações o servidor aceita — bloquear no front não basta, a validação acontece também no back-end.",
          },
          {
            type: "table",
            title: "Os quatro papéis",
            headers: ["Papel", "Para quem", "Alcance"],
            rows: [
              ["Admin", "Donos e coordenação", "Acesso total: usuários, financeiro, contratos, cursos e configurações."],
              ["Manager", "Equipe de suporte/atendimento", "Apoia alunos e professores, gerencia créditos e material, mas não acessa o financeiro completo nem cria usuários."],
              ["Teacher", "Professores", "Vê apenas as próprias aulas, alunos atribuídos, agenda e cadernos."],
              ["Student", "Alunos", "Vê apenas o próprio conteúdo: aulas, pagamentos, cursos e caderno."],
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Manager não é admin",
            text: "O manager tem uma versão reduzida do hub em `/hub/manager`. Ele consegue abrir a ficha de um aluno e dar suporte, mas ações destrutivas (desativar conta, mexer em planos e no fiscal) continuam exclusivas do admin.",
          },
        ],
      },
      {
        id: "modo-sudo",
        title: "Modo sudo: quando o sistema pede sua senha de novo",
        summary: "Por que certas ações exigem redigitar a senha, e quais são elas.",
        keywords: ["senha", "sudo", "segurança", "confirmação", "rate limit", "auditoria"],
        blocks: [
          {
            type: "p",
            text: "Ações de alto impacto exigem **modo sudo**: mesmo já logado, você precisa digitar sua senha de admin novamente. Isso protege contra alguém usando sua máquina desbloqueada e cria um registro claro de quem autorizou o quê.",
          },
          {
            type: "bullets",
            items: [
              "Desativar um aluno (encerrar matrícula).",
              "Marcar uma parcela ou a taxa de cancelamento como paga.",
              "Alterar o valor de uma parcela já gerada.",
              "Revelar dados sensíveis de um usuário (CPF/CNPJ, telefone, endereço).",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Limite de tentativas",
            text: "Cada uma dessas ações tem limite por hora (por exemplo, 3 desativações e 5 confirmações de taxa). Se você estourar o limite, o sistema recusa com **rateLimitExceeded** e é preciso aguardar — é proteção contra força bruta, não um bug.",
          },
        ],
      },
      {
        id: "automacoes",
        title: "O que o sistema faz sozinho",
        summary: "Rotinas automáticas (cron) e webhooks que rodam sem ninguém clicar.",
        keywords: ["cron", "automático", "rotina", "webhook", "agendado", "job"],
        blocks: [
          {
            type: "p",
            text: "Boa parte da operação acontece sem intervenção. Saber o que é automático evita retrabalho — e ajuda a diagnosticar quando algo “aconteceu sozinho”.",
          },
          {
            type: "fields",
            title: "Rotinas agendadas",
            items: [
              { name: "Cobranças", does: "Todo dia às 9h (Brasília), nunca de madrugada: gera as faturas pendentes e dispara os lembretes (2 dias antes, no vencimento e de 3 em 3 dias em atraso até o fim do mês). Com a política de inadimplência ativa (Configurações → Plataforma): no último dia do mês avisa aluno e professor de que o acesso será bloqueado; no mês seguinte, bloqueia o aluno e manda lembrete semanal; no dia 1 do mês posterior, cancela a matrícula sem multa (se o cancelamento automático estiver ligado; senão, só avisa os admins). Antes de cada envio, confere se o PIX ou o link do Stripe ainda vale e gera outro se venceu." },
              { name: "Aulas de alunos bloqueados", does: "Todo dia às 21h (Brasília): cancela as aulas de amanhã dos alunos bloqueados por inadimplência, sem crédito nem reposição, e avisa aluno, professor e admins." },
              { name: "Agenda", does: "Materializa as aulas recorrentes dos próximos meses, expira créditos vencidos, marca aulas não realizadas como atrasadas e envia lembretes de aula." },
              { name: "Aprendizado", does: "Envia lembretes de prática para os alunos." },
              { name: "Limpezas", does: "Remove cadernos, anexos, certificados e cache de IA já expirados." },
            ],
          },
          {
            type: "fields",
            title: "Webhooks (eventos externos)",
            items: [
              { name: "AbacatePay", does: "Quando um PIX é pago, marca a parcela como paga automaticamente, lança a receita e — no caso da taxa de cancelamento — finaliza o cancelamento do aluno." },
              { name: "Stripe", does: "Mesma função para planos cobrados em dólar (USD)." },
              { name: "WhatsApp", does: "Recebe as mensagens dos alunos e alimenta a tela de Conversas." },
              { name: "Resend", does: "Atualiza o status dos e-mails enviados (entregue, aberto, falhou) no histórico." },
            ],
          },
          {
            type: "note",
            variant: "success",
            title: "Não lance pagamento em dobro",
            text: "Se o aluno pagou pelo PIX gerado na plataforma, **não** é preciso marcar como pago manualmente: o webhook faz isso em segundos. A confirmação manual existe para pagamentos recebidos por fora (transferência, dinheiro, PIX em outra chave).",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. DASHBOARD
  // ─────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Os indicadores da escola e como interpretá-los.",
    icon: "LayoutDashboard",
    articles: [
      {
        id: "dashboard-visao",
        title: "Painel de indicadores",
        summary: "Receita, alunos ativos, aulas do período e crescimento — com filtro de período.",
        route: "/hub/admin/dashboard",
        keywords: ["kpi", "métricas", "mrr", "receita", "gráfico", "indicadores", "pwa"],
        blocks: [
          {
            type: "p",
            text: "É a tela de abertura da operação. Todos os números respeitam o **filtro de período** no topo — ao trocar de Mês para Semana ou Dia, os títulos dos cards mudam junto para deixar claro o recorte.",
          },
          {
            type: "fields",
            title: "Cards de indicador",
            items: [
              { name: "Receita", does: "Quanto entrou no período selecionado. Em visão mensal aparece como MRR (receita recorrente mensal)." },
              { name: "Alunos ativos", does: "Contagem de alunos com matrícula ativa no momento." },
              { name: "Aulas do período", does: "Total de aulas do recorte. É clicável: abre a lista das aulas do dia com horário, professor e aluno." },
              { name: "Novos alunos", does: "Crescimento da base no período — quantos entraram." },
              { name: "PWA", does: "Quantos usuários instalaram o app na tela inicial. Clique para ver o detalhamento por dispositivo." },
            ],
          },
          {
            type: "fields",
            title: "Blocos abaixo dos cards",
            items: [
              { name: "Fluxo de caixa", does: "Gráfico de entradas e saídas mês a mês, com a receita ainda pendente destacada à parte." },
              { name: "Estatísticas acadêmicas", does: "Taxa de presença nas aulas e ranking dos cursos mais consumidos." },
              { name: "Funil de onboarding", does: "Em que etapa os novos alunos estão travando antes de virar matrícula ativa." },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Receita pendente ≠ receita",
            text: "O gráfico separa o que já entrou do que está apenas previsto. A **receita pendente** são parcelas geradas mas ainda não pagas — ela não conta no lucro real, só na projeção.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. USUÁRIOS
  // ─────────────────────────────────────────────────────────────
  {
    id: "usuarios",
    title: "Usuários",
    description: "Cadastro, busca, ficha completa e encerramento de matrícula.",
    icon: "Users",
    articles: [
      {
        id: "lista-usuarios",
        title: "Lista de usuários e filtros",
        summary: "Como encontrar alguém rápido e o que cada filtro faz.",
        route: "/hub/admin/users",
        keywords: ["buscar", "filtro", "aluno", "professor", "listagem", "pesquisar"],
        blocks: [
          {
            type: "p",
            text: "A tela abre já filtrada em **alunos ativos**, que é o caso de uso mais comum. A busca do topo procura simultaneamente por nome, e-mail e telefone — e ignora formatação no telefone, então tanto faz digitar com ou sem parênteses e traços.",
          },
          {
            type: "fields",
            title: "Filtros disponíveis",
            items: [
              { name: "Cargo", does: "Restringe por papel: admin, professor, aluno ou manager." },
              { name: "Status", does: "Ativo ou inativo. Contas encerradas ficam como inativas, não são apagadas." },
              { name: "Contrato", does: "Separa quem já assinou o contrato de quem ainda não assinou." },
              { name: "Pagamento", does: "Quem está em dia ou em aberto no mês corrente." },
            ],
          },
          {
            type: "actions",
            title: "Botões do cabeçalho",
            items: [
              {
                label: "Ajuda",
                does: "Abre um guia rápido dentro da própria tela, com o resumo dos filtros e dos indicadores de cada linha.",
              },
              {
                label: "Criar usuário",
                does: "Abre o formulário de cadastro.",
                flow: "Cria a conta e dispara o convite de acesso automaticamente.",
              },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Os selos em cada linha",
            text: "Cada aluno mostra o professor vinculado, se o contrato está assinado, a situação do pagamento do mês e a próxima aula agendada — dá para triar a base inteira sem abrir ficha por ficha.",
          },
        ],
      },
      {
        id: "criar-usuario",
        title: "Criar um usuário",
        summary: "O que acontece do clique em “Criar usuário” até o primeiro acesso da pessoa.",
        route: "/hub/admin/users",
        keywords: ["cadastrar", "novo aluno", "convite", "matrícula", "senha", "onboarding"],
        blocks: [
          {
            type: "steps",
            title: "Fluxo completo",
            items: [
              "Você preenche nome, e-mail, papel e — para alunos — o pacote (plano) que ele vai assinar e o idioma do curso.",
              "O sistema cria a conta de autenticação e o registro do usuário no banco.",
              "Se for aluno com pacote selecionado, a assinatura é criada e as parcelas do período são geradas.",
              "A plataforma envia o convite de acesso por e-mail **e** por WhatsApp (quando há telefone cadastrado).",
              "A pessoa clica no link do convite e define a própria senha — você nunca cadastra senha por ela.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "O convite expira",
            text: "O link de definição de senha tem validade. Se a pessoa demorar e ele expirar, não recadastre o usuário: abra a ficha dela, vá na aba **Ações** e use **Reenviar Convite**.",
          },
          {
            type: "note",
            variant: "info",
            title: "E-mail já existente",
            text: "O e-mail é a chave única da conta. Se já houver cadastro com aquele endereço, a criação é recusada — procure a pessoa na lista (inclusive com o filtro de status em “inativo”) antes de tentar de novo.",
          },
        ],
      },
      {
        id: "ficha-usuario",
        title: "Ficha do usuário: as abas",
        summary: "O que existe dentro de cada aba da página de detalhes.",
        route: "/hub/admin/users",
        keywords: ["detalhes", "perfil", "abas", "ficha", "aluno", "professor"],
        blocks: [
          {
            type: "p",
            text: "Clicar em alguém na lista abre a ficha completa. As abas mudam conforme o papel — professor tem agenda e alunos vinculados; aluno tem pagamentos, currículo e certificado.",
          },
          {
            type: "fields",
            title: "Abas da ficha",
            items: [
              { name: "Informações pessoais", does: "Dados cadastrais, contato e endereço. Campos sensíveis ficam mascarados até você pedir para revelar." },
              { name: "Pagamentos (aluno)", does: "Assinatura ativa, parcelas, PIX de cada cobrança e histórico de planos." },
              { name: "Ganhos (professor)", does: "Valor/hora, aulas dadas no período e total a receber." },
              { name: "Contratos", does: "Contratos gerados para a pessoa, com status de assinatura e download do PDF." },
              { name: "Agenda (professor)", does: "Grade de horários e aulas do professor." },
              { name: "Alunos (professor)", does: "Quem está vinculado àquele professor." },
              { name: "Currículo (aluno)", does: "Trilha de aprendizado e progresso do aluno." },
              { name: "Aulas (aluno)", does: "Histórico das videochamadas realizadas." },
              { name: "Ações", does: "Reenvio de convite e a zona de perigo (encerramento de matrícula)." },
              { name: "Certificado (aluno)", does: "Emissão do certificado de conclusão." },
              { name: "Plano (aluno)", does: "Troca do pacote de assinatura." },
            ],
          },
          {
            type: "note",
            variant: "danger",
            title: "Revelar dados sensíveis é auditado",
            text: "CPF/CNPJ, telefone e endereço ficam criptografados. Ao clicar para revelar, o sistema pede sua senha e registra o acesso. Use apenas quando houver necessidade real — é dado protegido por LGPD.",
          },
        ],
      },
      {
        id: "pagamentos-aluno",
        title: "Aba Pagamentos: parcelas e cobranças",
        summary: "Gerar PIX, reenviar lembrete, corrigir valor e confirmar pagamento manual.",
        route: "/hub/admin/users",
        keywords: ["parcela", "pix", "cobrança", "fatura", "mensalidade", "pago", "boleto"],
        blocks: [
          {
            type: "p",
            text: "Cada parcela da assinatura aparece como uma linha com valor, vencimento e status. Parcelas que ainda não foram pagas trazem um botão de edição (ícone de lápis) que abre o painel de gestão daquela cobrança.",
          },
          {
            type: "table",
            title: "Status de uma parcela",
            headers: ["Status", "Significa"],
            rows: [
              ["pending", "Gerada e aguardando pagamento, ainda dentro do prazo."],
              ["overdue", "Venceu e não foi paga. O aluno já recebeu o aviso de atraso."],
              ["paid", "Quitada. Entra no lucro real e no cálculo de imposto."],
              ["cancelled", "Cancelada. Fica só como histórico, não afeta cálculo nenhum."],
            ],
          },
          {
            type: "actions",
            title: "Botões dentro do painel da parcela",
            items: [
              {
                label: "Gerar código de pagamento",
                does: "Cria a cobrança no gateway quando ela ainda não existe.",
                flow: "Em reais gera um PIX (QR Code + copia e cola) via AbacatePay; em dólar gera um link de checkout do Stripe.",
              },
              {
                label: "Gerar novamente",
                does: "Substitui um PIX vencido ou cancelado por um novo.",
                flow: "Aparece só para parcelas em atraso ou canceladas, e apenas em cobranças em reais — PIX tem prazo de validade e trava depois que expira.",
              },
              {
                label: "Reenviar lembrete de pagamento",
                does: "Manda de novo a cobrança para o aluno por e-mail e WhatsApp, com o mesmo código PIX.",
              },
              {
                label: "Atualizar (novo valor)",
                does: "Corrige o valor da parcela — para aplicar desconto ou acerto combinado.",
                flow: "Exige sua senha de admin e grava um log de auditoria com valor anterior e novo.",
                warning: "Se a cobrança já tinha sido gerada no gateway, gere o código novamente depois de mudar o valor — o PIX antigo continua com o valor velho.",
              },
              {
                label: "Confirmar e marcar como paga",
                does: "Registra a parcela como quitada sem esperar o gateway.",
                flow: "Exige sua senha; lança a taxa do gateway como despesa, grava auditoria e avisa o aluno por e-mail e notificação push.",
                warning: "Use apenas para pagamentos recebidos por fora da plataforma. Pagamento feito no PIX gerado aqui é confirmado sozinho pelo webhook.",
              },
            ],
          },
        ],
      },
      {
        id: "encerrar-matricula",
        title: "Encerrar matrícula e taxa de cancelamento",
        summary: "A zona de perigo: como desativar um aluno e o que acontece com a multa.",
        route: "/hub/admin/users",
        keywords: ["desativar", "cancelar", "multa", "taxa", "desligamento", "encerrar", "zona de perigo"],
        blocks: [
          {
            type: "p",
            text: "Fica na aba **Ações**, dentro do bloco vermelho de zona de perigo. É a operação mais sensível do sistema: ela cancela aulas futuras, encerra a assinatura e desativa o acesso da pessoa.",
          },
          {
            type: "steps",
            title: "O que acontece ao confirmar a desativação",
            items: [
              "Você digita sua senha de admin e confirma.",
              "O sistema procura o contrato assinado do aluno.",
              "Sem contrato ativo: as aulas futuras são canceladas e a conta é desativada na hora, sem cobrança.",
              "Com contrato em vigor e ainda faltando meses: é gerada uma taxa de cancelamento equivalente a 50% de uma mensalidade.",
              "O aluno recebe o PIX da taxa por e-mail e WhatsApp, e a assinatura entra no status “aguardando taxa”.",
              "Quando a taxa é paga, o cancelamento é finalizado: aulas canceladas, assinatura e contrato encerrados, conta desativada e e-mail de confirmação enviado.",
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Último mês não paga multa",
            text: "Se o aluno já está na última parcela do contrato, a regra entende que ele cumpriu o combinado: o cancelamento é imediato e **sem taxa**.",
          },
          {
            type: "actions",
            title: "Enquanto a taxa está pendente",
            items: [
              {
                label: "Copiar PIX",
                does: "Copia o código copia e cola da taxa para você mandar por outro canal.",
              },
              {
                label: "Reenviar Taxa (E-mail / WhatsApp)",
                does: "Dispara de novo a cobrança da taxa para o aluno, com o mesmo código.",
              },
              {
                label: "Confirmar e marcar como paga",
                does: "Confirma manualmente o recebimento da taxa e finaliza o cancelamento.",
                flow: "Exige sua senha; lança a receita “Taxa de Cancelamento” no financeiro, encerra assinatura e contrato, desativa o aluno e avisa por e-mail e push.",
                warning: "O código PIX gerado continua válido no gateway até expirar. Se o aluno pagar depois de você confirmar manualmente, o valor entra em duplicidade na conta — confira antes.",
              },
            ],
          },
          {
            type: "note",
            variant: "danger",
            title: "Não existe botão de desfazer",
            text: "Desativação cancela aulas futuras de verdade. Se foi engano, será preciso reativar a conta e reagendar as aulas manualmente — por isso o sistema pede senha e limita a 3 desativações por hora.",
          },
        ],
      },
      {
        id: "trocar-plano",
        title: "Trocar o pacote do aluno",
        summary: "Migrar alguém de plano sem quebrar o histórico de parcelas.",
        route: "/hub/admin/users",
        keywords: ["plano", "pacote", "upgrade", "downgrade", "assinatura", "migrar"],
        blocks: [
          {
            type: "p",
            text: "Na aba **Plano** da ficha do aluno você escolhe outro pacote ativo e confirma a transferência. As parcelas já pagas ficam intactas no histórico; as futuras são recalculadas pelo valor do novo pacote.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Regere as cobranças futuras",
            text: "Parcelas futuras que já tinham PIX gerado precisam do código atualizado após a troca. Passe na aba **Pagamentos** e use **Gerar novamente** nas que estiverem com o valor antigo.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. FINANCEIRO
  // ─────────────────────────────────────────────────────────────
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Transações, impostos, projeções e pacotes de assinatura.",
    icon: "Wallet",
    articles: [
      {
        id: "financeiro-painel",
        title: "Painel financeiro",
        summary: "Filtros, métricas, saldo dos gateways e a tabela de transações.",
        route: "/hub/admin/finances",
        keywords: ["finanças", "caixa", "receita", "despesa", "lucro", "transação"],
        blocks: [
          {
            type: "p",
            text: "Centraliza tudo que entra e sai. O ponto mais importante de entender: todos os cálculos de lucro e imposto usam **regime de caixa** — só conta o que foi efetivamente marcado como pago ou recebido.",
          },
          {
            type: "fields",
            title: "Filtros da barra superior",
            items: [
              { name: "Mês", does: "Recorta o período. Escolha “Todos os meses” para ver o acumulado do ano." },
              { name: "Ano", does: "Navega entre os últimos cinco anos." },
              { name: "Status", does: "Filtra por pago, pendente ou cancelado." },
              { name: "Origem", does: "Separa mensalidades de alunos, pagamentos a professores, receitas e despesas manuais." },
            ],
          },
          {
            type: "actions",
            title: "Botões de ação",
            items: [
              {
                label: "Configuração Fiscal",
                does: "Abre as tabelas de imposto usadas no cálculo do IRPF.",
                flow: "As alíquotas mudam por ano — é aqui que você atualiza quando o governo publica a tabela nova.",
              },
              {
                label: "Exportar",
                does: "Gera um arquivo com as transações do período filtrado, para contabilidade ou planilha.",
              },
              {
                label: "Previsões",
                does: "Abre a projeção detalhada: quais alunos e quais contas formam os valores previstos.",
              },
              {
                label: "Pacotes",
                does: "Abre a gestão de planos de assinatura.",
              },
              {
                label: "Nova Transação",
                does: "Cadastra manualmente uma receita ou despesa (aluguel, marketing, receita avulsa).",
              },
            ],
          },
          {
            type: "note",
            variant: "success",
            title: "Pagamento de professor entra sozinho",
            text: "Repasses processados no módulo de professores viram despesa automaticamente aqui. Não cadastre de novo como transação manual — vira despesa em dobro e distorce o imposto.",
          },
          {
            type: "p",
            text: "O card de **saldo dos gateways** mostra quanto está disponível e quanto está retido em cada adquirente (Stripe e AbacatePay). Se aparecer “não configurado”, é chave de API ausente no ambiente, não falta de saldo.",
          },
        ],
      },
      {
        id: "financeiro-fiscal",
        title: "Imposto e capacidade MEI",
        summary: "Como o IRPF estimado é calculado e o que o medidor de MEI indica.",
        route: "/hub/admin/finances",
        keywords: ["imposto", "irpf", "mei", "fiscal", "dedutível", "tributo", "limite"],
        blocks: [
          {
            type: "p",
            text: "O card de **IRPF estimado** combina três fatores para chegar no imposto devido.",
          },
          {
            type: "steps",
            items: [
              "Isenção MEI: 32% da receita é considerada livre de imposto por lei.",
              "Despesas dedutíveis: repasses a professores e custos marcados como dedutíveis abatem a base.",
              "Tabela progressiva: as alíquotas oficiais do ano são aplicadas sobre o lucro tributável.",
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Medidor de capacidade MEI",
            text: "O card de capacidade acompanha o quanto da receita anual permitida pelo MEI já foi consumido. Ao se aproximar do teto, é sinal para conversar com a contabilidade sobre mudança de regime — o sistema apenas avisa, não muda nada sozinho.",
          },
        ],
      },
      {
        id: "financeiro-planos",
        title: "Pacotes (planos de assinatura)",
        summary: "Criar, editar, desativar e excluir os planos vendidos aos alunos.",
        route: "/hub/admin/finances/plans",
        keywords: ["plano", "pacote", "preço", "mensalidade", "assinatura", "duração"],
        blocks: [
          {
            type: "p",
            text: "Pacote é o produto que o aluno assina: define preço, moeda, duração em meses e idioma. É o que alimenta a geração das parcelas na matrícula.",
          },
          {
            type: "actions",
            items: [
              {
                label: "Novo pacote",
                does: "Cria um plano.",
                flow: "Planos em reais são espelhados como produto na AbacatePay; planos em dólar usam o Stripe.",
              },
              {
                label: "Editar (lápis)",
                does: "Ajusta nome, preço e configurações do plano.",
                warning: "Mudar o preço não altera parcelas já geradas. Alunos existentes seguem no valor antigo até você trocar o plano deles individualmente.",
              },
              {
                label: "Ativar / Desativar",
                does: "Controla se o pacote aparece como opção em novas matrículas.",
                flow: "Desativar não afeta quem já assinou — apenas tira o plano da vitrine.",
              },
              {
                label: "Excluir (lixeira)",
                does: "Remove o plano definitivamente.",
                warning: "Só funciona se nenhum aluno estiver vinculado. Havendo matrícula associada, o sistema recusa — nesse caso o certo é desativar, não excluir.",
              },
            ],
          },
        ],
      },
      {
        id: "financeiro-previsoes",
        title: "Previsões (forecast)",
        summary: "Quanto ainda deve entrar e sair, item por item.",
        route: "/hub/admin/finances/forecast",
        keywords: ["projeção", "forecast", "previsão", "a receber", "a pagar", "futuro"],
        blocks: [
          {
            type: "p",
            text: "Enquanto o painel principal mostra o realizado, esta tela mostra o previsto — e, principalmente, **de onde** ele vem.",
          },
          {
            type: "bullets",
            items: [
              "Receita projetada: soma das mensalidades pendentes no período, com o nome de cada aluno.",
              "Despesas pendentes: contas já cadastradas com status pendente, listadas uma a uma.",
            ],
          },
          {
            type: "note",
            variant: "info",
            text: "Use os filtros de mês e ano para responder “quanto ainda tenho a receber neste mês?” sem abrir aluno por aluno.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. CONTRATOS
  // ─────────────────────────────────────────────────────────────
  {
    id: "contratos",
    title: "Contratos",
    description: "Modelos, assinaturas e os dados jurídicos da escola.",
    icon: "FileText",
    articles: [
      {
        id: "contratos-modelos",
        title: "Modelos de contrato",
        summary: "Criar templates com campos dinâmicos e controlar qual está valendo.",
        route: "/hub/admin/contracts",
        keywords: ["template", "modelo", "cláusula", "versão", "placeholder", "jurídico"],
        blocks: [
          {
            type: "p",
            text: "Um modelo é o texto-base usado para gerar cada contrato individual. Você escreve uma vez e o sistema preenche os dados de cada pessoa no momento da assinatura.",
          },
          {
            type: "fields",
            title: "Campos ao criar um modelo",
            items: [
              { name: "Nome", does: "Identificação interna do modelo." },
              { name: "Destinatário", does: "Se o contrato é para aluno ou para professor." },
              { name: "Região", does: "Brasil (BR) ou Estados Unidos (US) — define idioma e enquadramento legal." },
              { name: "Tipo de pessoa", does: "Pessoa física (PF) ou jurídica (PJ)." },
              { name: "Duração", does: "Meses de vigência. Obrigatório em contratos de professor." },
              { name: "Conteúdo", does: "O texto do contrato, com placeholders entre chaves duplas." },
            ],
          },
          {
            type: "p",
            text: "No conteúdo você usa marcadores que são substituídos automaticamente: `{{user.name}}`, `{{user.taxId}}`, `{{school.legalName}}`, `{{school.taxId}}` e `{{date}}`.",
          },
          {
            type: "actions",
            items: [
              {
                label: "Criar Template",
                does: "Publica um novo modelo.",
                flow: "Ao criar um modelo para a mesma combinação de destinatário e região, o novo entra como ativo e os anteriores são desativados automaticamente.",
              },
              {
                label: "Criar Nova Versão",
                does: "Duplica o modelo aberto já preenchido para você editar e salvar como versão seguinte.",
                flow: "Preserva o histórico: contratos já assinados continuam apontando para a versão vigente na época.",
              },
              {
                label: "Ativar",
                does: "Torna aquele modelo o vigente para sua combinação de destinatário e região.",
              },
              {
                label: "Excluir",
                does: "Apaga o modelo.",
                warning: "Só funciona se o modelo não estiver ativo e não tiver nenhuma assinatura vinculada. É proteção contra perder registro jurídico.",
              },
            ],
          },
        ],
      },
      {
        id: "contratos-assinaturas",
        title: "Assinaturas e status",
        summary: "Acompanhar quem assinou, baixar o PDF e reenviar por e-mail.",
        route: "/hub/admin/contracts",
        keywords: ["assinatura", "pdf", "assinado", "pendente", "download", "reenviar"],
        blocks: [
          {
            type: "p",
            text: "Lista cada contrato gerado, para quem, de qual modelo e em que estágio está.",
          },
          {
            type: "actions",
            items: [
              {
                label: "Baixar",
                does: "Abre o PDF assinado em uma nova aba.",
                flow: "O link é temporário, gerado na hora e com validade de uma hora — é o que evita que o documento fique público na internet.",
              },
              {
                label: "Reenviar e-mail",
                does: "Manda de novo para a pessoa o e-mail com o contrato anexado.",
              },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Contrato e matrícula andam juntos",
            text: "O contrato assinado é o que define se o encerramento da matrícula gera taxa de cancelamento. Aluno sem contrato assinado é desativado sem multa.",
          },
        ],
      },
      {
        id: "contratos-escola",
        title: "Dados da escola",
        summary: "As informações jurídicas que entram em todo contrato.",
        route: "/hub/admin/contracts",
        keywords: ["cnpj", "razão social", "endereço", "escola", "empresa", "dados"],
        blocks: [
          {
            type: "p",
            text: "Razão social, CNPJ e endereço da escola ficam aqui e alimentam os placeholders `{{school.*}}` de todos os modelos.",
          },
          {
            type: "note",
            variant: "warning",
            title: "Corrigir aqui não corrige o passado",
            text: "Contratos já assinados guardam o texto como estava no momento da assinatura. Alterar os dados agora vale só para os próximos — documentos antigos com erro precisam ser reemitidos.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. CURSOS
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
        route: "/hub/admin/courses",
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
        route: "/hub/admin/courses",
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
      {
        id: "meu-aprendizado",
        title: "Meu Aprendizado",
        summary: "A visão de aluno, para você mesmo consumir os cursos.",
        route: "/hub/admin/my-courses",
        keywords: ["meu aprendizado", "estudar", "matrícula", "player", "progresso"],
        blocks: [
          {
            type: "p",
            text: "Aqui aparecem os cursos em que **você** está matriculado, com a mesma experiência que o aluno tem. É útil para revisar o material publicado do ponto de vista de quem consome.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. COMUNICAÇÃO
  // ─────────────────────────────────────────────────────────────
  {
    id: "comunicacao",
    title: "Comunicação",
    description: "Notificações, WhatsApp, e-mails e a caixa de entrada.",
    icon: "Bell",
    articles: [
      {
        id: "comunicacao-notificacoes",
        title: "Enviar notificações",
        summary: "Push e notificação interna para toda a base ou para pessoas específicas.",
        route: "/hub/admin/communication",
        keywords: ["notificação", "push", "aviso", "comunicado", "in-app", "broadcast"],
        blocks: [
          {
            type: "p",
            text: "Notificação é o canal interno: aparece no sininho da plataforma e, se a pessoa autorizou, também como push no celular.",
          },
          {
            type: "fields",
            title: "Ao montar o envio",
            items: [
              { name: "Título e mensagem", does: "O conteúdo que a pessoa vê." },
              { name: "Destinatário", does: "Todos, um papel inteiro (ex.: só professores) ou usuários selecionados um a um." },
              { name: "Canais", does: "Notificação interna, push, ou os dois." },
              { name: "Link de ação", does: "Para onde a pessoa vai ao tocar na notificação." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Não dá para desenviar",
            text: "Push sai na hora e não volta. Antes de disparar para toda a base, mande primeiro para você mesmo usando o destinatário específico.",
          },
          {
            type: "p",
            text: "O histórico abaixo mostra tudo que já foi enviado, com data e alcance — serve para conferir se um comunicado saiu e para quem.",
          },
        ],
      },
      {
        id: "comunicacao-whatsapp",
        title: "Templates de WhatsApp",
        summary: "Por que mensagens de WhatsApp precisam de modelo aprovado.",
        route: "/hub/admin/communication",
        keywords: ["whatsapp", "template", "meta", "aprovação", "modelo", "waba"],
        blocks: [
          {
            type: "p",
            text: "O WhatsApp só permite iniciar conversa com um cliente usando um **template previamente aprovado pela Meta**. Por isso não dá para escrever texto livre para quem não falou com você nas últimas 24 horas.",
          },
          {
            type: "actions",
            items: [
              {
                label: "Criar template",
                does: "Submete um novo modelo de mensagem para aprovação da Meta.",
                flow: "O template nasce pendente e pode levar horas para ser aprovado ou rejeitado. Só depois de aprovado ele pode ser usado.",
              },
              {
                label: "Atualizar templates",
                does: "Puxa da Meta a lista mais recente com o status atualizado de cada modelo.",
              },
              {
                label: "Enviar mensagem",
                does: "Dispara um template aprovado para um aluno.",
              },
              {
                label: "Excluir",
                does: "Remove o template da conta.",
                warning: "Templates usados por rotinas automáticas (lembrete de pagamento, boas-vindas) não devem ser excluídos — os avisos automáticos param de sair.",
              },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Janela de 24 horas",
            text: "Quando o aluno te responde, abre uma janela de 24 horas em que você pode conversar livremente, sem template. Passou disso, só template de novo. É por isso que a tela de Conversas às vezes bloqueia o texto livre.",
          },
        ],
      },
      {
        id: "comunicacao-emails",
        title: "Histórico de e-mails",
        summary: "Conferir se um e-mail chegou e o que ele dizia.",
        route: "/hub/admin/communication",
        keywords: ["e-mail", "email", "resend", "entregue", "aberto", "bounce", "histórico"],
        blocks: [
          {
            type: "p",
            text: "Lista os e-mails enviados pela plataforma com status de entrega. Clicar em um item abre o conteúdo exato que a pessoa recebeu — útil quando o aluno diz que “não chegou nada”.",
          },
          {
            type: "bullets",
            items: [
              "O status é atualizado automaticamente pelo provedor (entregue, aberto, falhou).",
              "A lista se atualiza sozinha em tempo real, sem precisar recarregar a página.",
              "O botão de atualizar métricas mostra o consumo da cota de envio do provedor.",
            ],
          },
        ],
      },
      {
        id: "conversas",
        title: "Conversas (WhatsApp)",
        summary: "A caixa de entrada para falar direto com os alunos.",
        route: "/hub/admin/conversas",
        keywords: ["chat", "conversa", "whatsapp", "mensagem", "atendimento", "suporte"],
        blocks: [
          {
            type: "p",
            text: "Interface de chat conectada ao WhatsApp da escola. Mensagens que os alunos mandam chegam aqui em tempo real, e a resposta sai pelo número oficial.",
          },
          {
            type: "note",
            variant: "info",
            title: "Texto livre depende da janela",
            text: "Dentro das 24 horas após a última mensagem do aluno você escreve normalmente. Fora dessa janela, só é possível iniciar com template aprovado — a limitação é da Meta, não da plataforma.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. OPERAÇÃO INTERNA
  // ─────────────────────────────────────────────────────────────
  {
    id: "operacao",
    title: "Operação Interna",
    description: "Onboarding de alunos, tarefas da equipe e procedimentos.",
    icon: "ClipboardList",
    articles: [
      {
        id: "onboarding",
        title: "Onboarding de alunos",
        summary: "Acompanhar o perfil de entrada de cada novo aluno.",
        route: "/hub/admin/students/onboarding",
        keywords: ["onboarding", "perfil", "nivelamento", "entrada", "novo aluno", "questionário"],
        blocks: [
          {
            type: "p",
            text: "Todo aluno novo preenche um perfil de entrada — objetivos, nível, disponibilidade e preferências. Esta tela lista os perfis por status para você ver quem já concluiu e quem travou no meio.",
          },
          {
            type: "bullets",
            items: [
              "Clique em um perfil para ver as respostas completas.",
              "Perfis incompletos indicam alunos que começaram e abandonaram — vale um contato ativo.",
              "O funil no Dashboard resume esses mesmos dados em formato de etapas.",
            ],
          },
        ],
      },
      {
        id: "tarefas",
        title: "Tarefas e projetos",
        summary: "O gestor de tarefas interno da equipe.",
        route: "/hub/admin/tasks",
        keywords: ["tarefa", "task", "projeto", "kanban", "to-do", "equipe"],
        blocks: [
          {
            type: "p",
            text: "Gestor de tarefas da operação, organizado em projetos com colunas de status personalizáveis. As tarefas sem projeto ficam na caixa de entrada.",
          },
          {
            type: "bullets",
            items: [
              "Crie projetos para separar frentes de trabalho (marketing, pedagógico, financeiro).",
              "Cada projeto tem seus próprios status, então o fluxo pode ser diferente em cada frente.",
              "Tarefas podem ser atribuídas a pessoas da equipe.",
            ],
          },
        ],
      },
      {
        id: "procedimentos",
        title: "Procedimentos (POPs)",
        summary: "A base de conhecimento escrita pela equipe.",
        route: "/hub/admin/procedures",
        keywords: ["pop", "procedimento", "manual", "processo", "documentação", "padrão"],
        blocks: [
          {
            type: "p",
            text: "POP é Procedimento Operacional Padrão: o passo a passo de como a equipe executa uma rotina. Enquanto esta Central de Ajuda documenta **o sistema**, os POPs documentam **o processo da sua escola**.",
          },
          {
            type: "actions",
            items: [
              {
                label: "Novo POP",
                does: "Cria um procedimento com editor de texto rico.",
              },
              {
                label: "Buscar procedimentos",
                does: "Filtra a lista pelo título.",
              },
              {
                label: "Excluir (lixeira)",
                does: "Remove o procedimento.",
                warning: "Não há como desfazer — o conteúdo é perdido.",
              },
            ],
          },
          {
            type: "note",
            variant: "info",
            title: "Exemplos de bons POPs",
            text: "“Como conduzir a primeira aula experimental”, “O que fazer quando o aluno pede reembolso”, “Checklist de contratação de professor”. Regras de negócio da escola, não funcionamento de botão.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. CONFIGURAÇÕES
  // ─────────────────────────────────────────────────────────────
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Sua conta, segurança e ajustes gerais.",
    icon: "Settings",
    articles: [
      {
        id: "config-conta",
        title: "Conta e segurança",
        summary: "Senha, verificação em duas etapas e preferências de notificação.",
        route: "/hub/admin/settings",
        keywords: ["senha", "2fa", "mfa", "segurança", "totp", "conta", "preferências"],
        blocks: [
          {
            type: "fields",
            items: [
              { name: "Conta", does: "Nome, e-mail, foto e idioma da interface." },
              { name: "Segurança", does: "Troca de senha e ativação da verificação em duas etapas (2FA)." },
              { name: "Notificações", does: "Quais avisos você quer receber e por quais canais." },
              { name: "Aparência", does: "Tema claro/escuro e ajustes visuais." },
            ],
          },
          {
            type: "note",
            variant: "warning",
            title: "Ative o 2FA",
            text: "Sua conta tem acesso a dados financeiros e pessoais de toda a base. A verificação em duas etapas usa um app autenticador (Google Authenticator, Authy) e é a proteção mais efetiva contra acesso indevido.",
          },
        ],
      },
      {
        id: "config-perfil",
        title: "Meu Perfil",
        summary: "Seus dados públicos dentro da plataforma.",
        route: "/hub/admin/profile",
        keywords: ["perfil", "foto", "avatar", "meus dados"],
        blocks: [
          {
            type: "p",
            text: "É como você aparece para o resto da equipe: nome, foto e informações de contato. Alterações refletem imediatamente no menu do topo e nos registros de autoria (POPs, tarefas, logs de auditoria).",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 10. SOLUÇÃO DE PROBLEMAS
  // ─────────────────────────────────────────────────────────────
  {
    id: "problemas",
    title: "Solução de Problemas",
    description: "As dúvidas que mais aparecem no dia a dia.",
    icon: "LifeBuoy",
    articles: [
      {
        id: "problema-pagamento",
        title: "O aluno pagou mas continua como pendente",
        summary: "O que verificar antes de confirmar o pagamento na mão.",
        keywords: ["pagou", "pendente", "não baixou", "pix", "webhook", "conciliação"],
        blocks: [
          {
            type: "steps",
            items: [
              "Confirme se ele pagou pelo PIX gerado na plataforma — pagamento em outra chave não é reconhecido automaticamente.",
              "Aguarde alguns minutos: a baixa depende do aviso do gateway e não é instantânea.",
              "Confira na aba Pagamentos se o valor pago bate com o valor da parcela.",
              "Se pagou por fora (transferência, dinheiro, outra chave), aí sim use Confirmar e marcar como paga.",
            ],
          },
          {
            type: "note",
            variant: "danger",
            title: "Cuidado com a dupla baixa",
            text: "Se você confirmar manualmente e o pagamento pelo gateway cair depois, o valor pode ser contado duas vezes no financeiro. Confirme manualmente só quando tiver certeza de que o pagamento **não** veio pelo PIX da plataforma.",
          },
        ],
      },
      {
        id: "problema-acesso",
        title: "O usuário não consegue entrar",
        summary: "Convite expirado, e-mail errado ou conta desativada.",
        keywords: ["não entra", "login", "senha", "convite", "acesso", "bloqueado"],
        blocks: [
          {
            type: "steps",
            items: [
              "Verifique na lista se a conta está **ativa** — o filtro de status abre já em ativos, então contas encerradas ficam escondidas.",
              "Confirme se o e-mail cadastrado está correto: é ele que identifica a conta.",
              "Se a pessoa nunca definiu senha, o convite provavelmente expirou: abra a ficha, aba Ações, e use Reenviar Convite.",
              "Peça para checar a caixa de spam — o convite chega por e-mail e também por WhatsApp.",
            ],
          },
        ],
      },
      {
        id: "problema-pix-expirado",
        title: "O PIX venceu ou não abre",
        summary: "Códigos PIX têm validade e precisam ser regerados.",
        keywords: ["pix expirado", "qr code", "vencido", "não funciona", "regerar"],
        blocks: [
          {
            type: "p",
            text: "Códigos PIX expiram. Quando isso acontece, a parcela fica em atraso e o código antigo para de funcionar no app do banco.",
          },
          {
            type: "steps",
            items: [
              "Abra a aba Pagamentos do aluno e clique no lápis da parcela.",
              "Use **Gerar novamente** para criar um código novo.",
              "Use **Reenviar lembrete de pagamento** para mandar o código atualizado por e-mail e WhatsApp. O reenvio confere a validade antes e, se o código venceu, gera outro sozinho.",
            ],
          },
          {
            type: "note",
            variant: "info",
            text: "Os lembretes automáticos também conferem o código antes de enviar: o aluno nunca recebe um PIX ou link do Stripe vencido. Quando o aluno clica em verificar e o gateway diz que o código expirou, a parcela continua em aberto (não é mais cancelada) e fica pronta para gerar outro.",
          },
          {
            type: "note",
            variant: "info",
            text: "O botão Gerar novamente só aparece em parcelas em atraso ou canceladas, e apenas em cobranças em reais. Cobranças em dólar usam link do Stripe, que segue outra regra de validade.",
          },
        ],
      },
      {
        id: "problema-notificacao",
        title: "O aluno diz que não recebeu o aviso",
        summary: "Onde conferir se a mensagem realmente saiu.",
        keywords: ["não recebeu", "e-mail", "whatsapp", "notificação", "entrega"],
        blocks: [
          {
            type: "steps",
            items: [
              "Em Notificações › histórico de e-mails, procure o envio e veja o status de entrega.",
              "Se o status for “falhou”, o e-mail cadastrado provavelmente está errado ou a caixa está cheia.",
              "Para WhatsApp, confirme se há telefone cadastrado na ficha — sem número, só o e-mail é enviado.",
              "Para push, lembre que ele só chega se a pessoa autorizou notificações no navegador ou instalou o app.",
            ],
          },
        ],
      },
    ],
  },
];
