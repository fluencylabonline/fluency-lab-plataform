import type { AdminHelpRoute, RoleHelpContent } from "../page-help.types";

/**
 * Ajuda das páginas do admin — português.
 *
 * O admin executa as ações irreversíveis da plataforma. Onde uma ação não tem
 * desfazer, cobra senha ou gera auditoria, o texto diz isso antes de explicar
 * como fazer. Ver `.agents/rules/page-help.md`.
 */
export const ADMIN_HELP_PT: RoleHelpContent<AdminHelpRoute> = {
  "/hub/admin/profile": {
    title: "Meu Perfil",
    summary: "Seus dados dentro da plataforma e o mapa das áreas do admin.",
    docsArticleId: "config-perfil",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Seus dados públicos dentro da plataforma: nome, foto e informações de contato.",
      },
      {
        heading: "O que existe no seu menu",
        body: [
          "Dashboard: indicadores de receita, alunos, aulas e crescimento.",
          "Usuários: a base inteira, com a ficha completa de cada pessoa.",
          "Financeiro: transações, impostos, previsões e pacotes.",
          "Contratos: modelos, assinaturas e dados jurídicos da escola.",
          "Cursos: o catálogo de cursos em vídeo.",
          "Comunicação: notificações, templates de WhatsApp e histórico de e-mails.",
          "Conversas, Tarefas, Procedimentos e Central de Ajuda.",
        ],
      },
      {
        heading: "Tudo aqui é restrito",
        body: "Sua conta alcança dados pessoais e financeiros de toda a base. Ações sensíveis pedem sua senha de novo (modo sudo) e ficam registradas em auditoria — não é desconfiança, é rastreabilidade.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Sua página inicial",
        text: "Aqui ficam seus dados. O trabalho acontece no Dashboard, em Usuários e no Financeiro.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Por onde circular",
        text: "Dashboard, Usuários, Financeiro, Contratos, Cursos, Comunicação, Conversas, Tarefas, Procedimentos e Central de Ajuda.",
      },
      {
        id: "sudo",
        title: "Modo sudo",
        text: "Ações sensíveis — confirmar pagamento na mão, mudar valor de parcela, revelar CPF, desativar aluno — pedem sua senha de novo e gravam auditoria. Há limite de tentativas.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "Este botão em toda página",
        text: "O (?) explica a tela em que você está. Para os guias completos, incluindo o que o sistema faz sozinho por cron e webhook, use a Central de Ajuda.",
      },
    ],
  },

  "/hub/admin/dashboard": {
    title: "Dashboard",
    summary:
      "Os indicadores da escola: receita, despesa, alunos, aulas e onboarding, com filtro de período.",
    docsArticleId: "dashboard-visao",
    sections: [
      {
        heading: "Os números financeiros",
        body: [
          "Receita Total e Despesa Total do período filtrado.",
          "Lucro Líquido, com a margem em porcentagem.",
          "A Receber é o que ainda não entrou.",
          "Fluxo de Caixa mostra receitas e despesas dos últimos 6 meses.",
        ],
      },
      {
        heading: "Receita pendente não é receita",
        body: "A Receber é projeção: são parcelas ainda em aberto. Somar isso ao caixa para tomar decisão é o erro mais comum nesta tela.",
      },
      {
        heading: "Status de Aulas",
        body: "A distribuição entre Concluídas, No-show, Canceladas pelo Aluno e Canceladas pelo Professor. Muita aula cancelada por professor costuma indicar um problema de alocação, não de aluno.",
      },
      {
        heading: "Funil de Onboarding",
        body: "Quantos alunos estão em cada etapa do processo inicial e quantos saíram em cada uma. A etapa com mais saídas é o gargalo do momento.",
      },
      {
        heading: "Cursos em Destaque e Adoção do PWA",
        body: "Os cursos com mais matrículas, e quantos usuários instalaram a plataforma como aplicativo.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O painel da escola",
        text: "Receita, alunos, aulas e onboarding num lugar. Tudo respeita o filtro de período.",
      },
      {
        id: "finance",
        target: "admin-dashboard.finance",
        title: "Os números financeiros",
        text: "Receita, despesa, lucro com margem e A Receber, mais o fluxo de caixa dos últimos 6 meses.",
      },
      {
        id: "pending",
        target: "admin-dashboard.finance",
        title: "A Receber não é caixa",
        text: "É projeção — parcelas ainda em aberto. Somar isso ao caixa para decidir algo é o erro mais comum nesta tela.",
      },
      {
        id: "academic",
        target: "admin-dashboard.academic",
        title: "Status de Aulas",
        text: "Concluídas, No-show, canceladas pelo aluno e canceladas pelo professor. Muito cancelamento de professor costuma ser problema de alocação, não de aluno.",
      },
      {
        id: "funnel",
        target: "admin-dashboard.funnel",
        title: "Funil de Onboarding",
        text: "Quantos alunos estão em cada etapa inicial e quantos saíram em cada uma. A etapa com mais saídas é o gargalo do momento.",
      },
    ],
  },

  "/hub/admin/users": {
    title: "Usuários",
    summary:
      "A base inteira de alunos, professores, managers e admins, com busca e filtros.",
    docsArticleId: "lista-usuarios",
    sections: [
      {
        heading: "A busca e os quatro filtros",
        body: [
          "A busca encontra por nome, e-mail ou telefone.",
          "Cargo: Todos os Cargos, Administrador, Professor, Aluno ou Gerente. Abre em Aluno.",
          "Status: Todos, Ativos ou Inativos. Abre em Ativos — conta encerrada só aparece ao trocar.",
          "Contrato: Todos contratos, Ativo ou Sem Contrato.",
          "Pagamento: Todos pagamentos, Pagos ou Pendentes.",
        ],
      },
      {
        heading: "Criar Usuário",
        body: "O botão do topo abre o cadastro. Ao salvar, a conta é criada e o convite de acesso sai automaticamente por e-mail e WhatsApp. A pessoa define a própria senha pelo link — a escola nunca cadastra senha de ninguém.",
      },
      {
        heading: "O convite expira",
        body: "Se a pessoa demorar, o link para de funcionar. Nesse caso reenvie o convite pela ficha dela, na aba de ações — não é preciso recriar a conta.",
      },
      {
        heading: "Perfil Adaptativo",
        body: "O botão à direita dos filtros leva ao onboarding: os perfis de entrada dos alunos novos e quem travou no meio.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A base de usuários",
        text: "Todo mundo da escola está aqui: alunos, professores, managers e admins.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "A busca",
        text: "Encontra por nome, e-mail ou telefone.",
      },
      {
        id: "filters",
        target: "users.filters",
        title: "Os quatro filtros",
        text: "Cargo (abre em Aluno), Status (abre em Ativos), Contrato e Pagamento. Status em Ativos é a pegadinha: conta desativada some da lista e parece não existir.",
      },
      {
        id: "create",
        target: "users.create",
        title: "Criar Usuário",
        text: "Cria a conta e dispara o convite por e-mail e WhatsApp automaticamente. A pessoa define a própria senha pelo link do convite.",
      },
      {
        id: "list",
        target: "users.list",
        title: "A lista",
        text: "Um cartão por pessoa, com os selos de contrato e pagamento à vista. Clique para abrir a ficha completa.",
      },
      {
        id: "onboarding",
        target: "users.onboarding",
        title: "Perfil Adaptativo",
        text: "Os perfis de entrada dos alunos novos, com quem já respondeu e quem parou no meio.",
      },
    ],
  },

  "/hub/admin/users/[userId]": {
    title: "Ficha do usuário",
    summary:
      "Tudo sobre uma pessoa — e onde ficam as ações irreversíveis da plataforma.",
    docsArticleId: "ficha-usuario",
    sections: [
      {
        heading: "As abas mudam conforme o cargo",
        body: [
          "Perfil aparece sempre, com as ações administrativas ao final.",
          "Para aluno: Pagamento, Contrato e Plano, Aulas e Currículo, e Certificado.",
          "Para professor: Extrato de Ganhos, Contratos, Agenda e Alunos.",
        ],
      },
      {
        heading: "Os botões de uma parcela",
        body: [
          "Gerar código de pagamento cria a cobrança no gateway: PIX pela AbacatePay em reais, link de checkout Stripe em dólar.",
          "Gerar novamente substitui um PIX vencido ou cancelado. Só aparece em parcela atrasada ou cancelada, e só em cobrança em reais.",
          "Reenviar lembrete manda a cobrança de novo por e-mail e WhatsApp, com o mesmo código.",
          "Atualizar (novo valor) corrige o valor. Exige sua senha e grava auditoria com o valor anterior e o novo.",
          "Confirmar e marcar como paga registra a quitação sem esperar o gateway. Exige senha, lança a taxa do gateway como despesa e avisa o aluno.",
        ],
      },
      {
        heading: "Duas armadilhas de cobrança",
        body: "Mudou o valor de uma parcela que já tinha cobrança gerada? Gere o código de novo — o PIX antigo continua com o valor velho. E só confirme pagamento na mão para dinheiro recebido fora da plataforma: PIX pago no código gerado aqui é confirmado sozinho pelo webhook, e confirmar por cima gera dupla baixa.",
      },
      {
        heading: "Encerrar matrícula",
        body: "Desativar um aluno cancela as aulas futuras de verdade, encerra assinatura e contrato e, fora do último mês de contrato, gera a taxa de cancelamento de 50% de uma mensalidade. Exige sua senha. Não existe botão de desfazer.",
      },
      {
        heading: "Enquanto a taxa de cancelamento está pendente",
        body: "Copiar PIX pega o código para enviar por outro canal, Reenviar Taxa dispara a cobrança de novo, e Confirmar e marcar como paga finaliza o cancelamento. Atenção: o código PIX continua válido no gateway até expirar — se o aluno pagar depois de você confirmar na mão, o valor entra duplicado.",
      },
      {
        heading: "Revelar dados sensíveis é auditado",
        body: "CPF, telefone completo e endereço podem ser revelados por você, com senha. Cada revelação fica registrada.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A ficha completa",
        text: "Tudo sobre uma pessoa, em abas — e é daqui que saem as ações que não têm desfazer.",
      },
      {
        id: "tabs",
        target: "user-details.tabs",
        title: "As abas",
        text: "Perfil aparece sempre. Aluno tem Pagamento, Contrato e Plano, Aulas e Currículo e Certificado. Professor tem Extrato de Ganhos, Contratos, Agenda e Alunos.",
      },
      {
        id: "payments",
        target: "user-details.tabs",
        title: "Os botões de uma parcela",
        text: "Gerar código cria a cobrança; Gerar novamente troca um PIX vencido; Reenviar lembrete reenvia a mesma cobrança; Atualizar corrige o valor com senha e auditoria; Confirmar e marcar como paga registra a quitação.",
      },
      {
        id: "double-charge",
        title: "Cuidado com a dupla baixa",
        text: "Confirme pagamento na mão só para dinheiro recebido fora da plataforma. PIX pago no código gerado aqui é confirmado sozinho pelo webhook. E se você mudou o valor, gere o código de novo: o PIX antigo mantém o valor velho.",
      },
      {
        id: "actions",
        target: "user-details.actions",
        title: "A zona de perigo",
        text: "Reenviar convite, desativar a conta e encerrar a matrícula. Desativar cancela aulas futuras, encerra assinatura e contrato e gera a taxa de 50% fora do último mês. Pede sua senha e não tem desfazer.",
      },
      {
        id: "sensitive",
        title: "Revelar dado sensível é auditado",
        text: "CPF, telefone e endereço podem ser revelados por você, com senha. Cada revelação fica registrada com o seu nome.",
      },
    ],
  },

  "/hub/admin/students/onboarding": {
    title: "Perfis Adaptativos",
    summary:
      "Os perfis de entrada dos alunos novos: quem respondeu, quem travou e o diagnóstico de cada um.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "Por que isto importa",
        body: "Todo aluno novo preenche um perfil de entrada — objetivos, nível, disponibilidade e preferências. É o que orienta a alocação com o professor certo e o planejamento das primeiras aulas.",
      },
      {
        heading: "Novo Perfil",
        body: "O botão do topo cria um perfil do zero — útil quando o aluno foi matriculado sem passar pelo questionário.",
      },
      {
        heading: "O menu de cada item",
        body: [
          "Ver abre o diagnóstico pedagógico gerado a partir das respostas.",
          "Editar abre o questionário para completar ou corrigir.",
          "Excluir remove o perfil.",
        ],
      },
      {
        heading: "Perfil incompleto é dinheiro parado",
        body: "Aluno que não conclui o perfil é alocado no escuro, e realocação depois custa caro para os dois lados. Vale tratar a lista de incompletos como fila de trabalho.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O onboarding dos alunos novos",
        text: "Todo aluno novo preenche um perfil de entrada. É ele que orienta a alocação com o professor certo.",
      },
      {
        id: "new",
        target: "manager-onboarding.new",
        title: "Novo Perfil",
        text: "Cria um perfil do zero — útil quando o aluno foi matriculado sem passar pelo questionário.",
      },
      {
        id: "list",
        target: "manager-onboarding.list",
        title: "A lista",
        text: "Um item por aluno, com a situação do perfil. Ver abre o diagnóstico, Editar abre o questionário, Excluir remove.",
      },
      {
        id: "why",
        title: "Incompleto é dinheiro parado",
        text: "Aluno sem perfil concluído é alocado no escuro, e realocar depois custa caro. Trate a lista de incompletos como fila de trabalho.",
      },
    ],
  },

  "/hub/admin/students/onboarding/[profileId]": {
    title: "Questionário do aluno",
    summary: "O perfil de entrada do aluno, para preencher ou corrigir.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "O que é este formulário",
        body: "O questionário de entrada respondido na matrícula: objetivo com o idioma, experiência anterior, disponibilidade, nível que o aluno atribui a si mesmo e o quanto pretende se dedicar.",
      },
      {
        heading: "Quando você preenche por ele",
        body: "Quando o aluno travou no meio e não retoma sozinho. Preencher durante um atendimento costuma ser mais rápido que insistir por mensagem.",
      },
      {
        heading: "Responda como o aluno responderia",
        body: "As respostas alimentam o diagnóstico pedagógico e a alocação. Chutar nível ou objetivo para destravar o cadastro estraga justamente o que o formulário serve para produzir.",
      },
      {
        heading: "Depois de concluir",
        body: "Com o perfil completo, o diagnóstico pedagógico pode ser gerado e, a partir dele, o plano de estudos.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O perfil de entrada",
        text: "O questionário que o aluno responde na matrícula. Você pode preencher ou corrigir.",
      },
      {
        id: "form",
        target: "manager-onboarding.form",
        title: "As perguntas",
        text: "Objetivo, experiência anterior, disponibilidade, nível autoatribuído e comprometimento. Avance pelos passos até o fim.",
      },
      {
        id: "honesty",
        title: "Responda como o aluno responderia",
        text: "As respostas alimentam o diagnóstico e a alocação. Chutar só para destravar o cadastro estraga o que o formulário serve para produzir.",
      },
    ],
  },

  "/hub/admin/students/onboarding/[profileId]/view": {
    title: "Diagnóstico Pedagógico",
    summary:
      "O relatório gerado por IA a partir do perfil do aluno, e o ponto de onde sai o plano de estudos.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "O que é o relatório",
        body: "Uma leitura pedagógica do aluno feita por IA, cruzando as respostas do questionário com o resultado do nivelamento: objetivo, contexto, pontos de atenção e sugestões de caminho.",
      },
      {
        heading: "Dados Estruturais",
        body: [
          "Nível Percebido é o nível que o aluno se atribuiu — pode não bater com o nivelamento, e a diferença já é informação.",
          "Comprometimento é o quanto ele declarou que pretende se dedicar, de 0 a 10.",
        ],
      },
      {
        heading: "Geração de Plano",
        body: "A partir do diagnóstico, esta tela gera o plano de estudos. A chave IA Criativa permite que a IA sugira temas quando não encontra material equivalente no banco — ligue para perfis fora do comum, deixe desligada quando quiser o plano preso ao material já revisado.",
      },
      {
        heading: "Quem mais lê isto",
        body: "O professor do aluno vê este mesmo relatório, em modo de leitura. Confira se está coerente antes de considerar o onboarding concluído.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O diagnóstico do aluno",
        text: "Relatório pedagógico gerado por IA a partir do questionário e do nivelamento. É daqui que sai o plano de estudos.",
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
        text: "Nível Percebido é o que o aluno se atribuiu, e pode divergir do nivelamento — a diferença já é informação. Comprometimento vai de 0 a 10.",
      },
      {
        id: "plan",
        target: "manager-diagnosis.plan",
        title: "Geração de Plano",
        text: "Gera o plano a partir do diagnóstico. A chave IA Criativa deixa a IA sugerir temas quando falta material equivalente: ligue para perfis fora do comum, deixe desligada para prender o plano ao material revisado.",
      },
    ],
  },

  "/hub/admin/finances": {
    title: "Financeiro",
    summary:
      "Transações, métricas, saldo dos gateways, imposto estimado e a capacidade do MEI.",
    docsArticleId: "financeiro-painel",
    sections: [
      {
        heading: "O menu de ações e o botão de nova transação",
        body: [
          "O menu de ações (o botão com os três pontos) reúne quatro itens.",
          "Configuração Fiscal abre as tabelas de imposto usadas no cálculo do IRPF — é onde você atualiza as alíquotas quando sai a tabela nova do ano.",
          "Exportar gera um arquivo com as transações do período filtrado, para contabilidade ou planilha.",
          "Previsões abre a projeção detalhada: quais alunos e quais contas formam os valores previstos.",
          "Pacotes abre a gestão dos planos de assinatura.",
          "Nova Transação cadastra manualmente uma receita ou despesa — aluguel, marketing, receita avulsa.",
        ],
      },
      {
        heading: "Nova Transação, campo a campo",
        body: [
          "Tipo: Receita ou Despesa.",
          "Status: Pago, Pendente ou Cancelado.",
          "Descrição, Valor e Data.",
          "Categoria aceita buscar uma existente ou criar na hora.",
          "Método de Pagamento e Anexo, para guardar o comprovante junto.",
        ],
      },
      {
        heading: "Pagamento de professor entra sozinho",
        body: "O fechamento dos professores vira despesa automaticamente a partir das aulas registradas. Lançar isso à mão como Nova Transação duplica o valor no resultado.",
      },
      {
        heading: "Medidor de capacidade MEI",
        body: "Indica quanto do teto anual do MEI já foi consumido pela receita do ano. Serve para antecipar a mudança de regime antes de estourar, não depois.",
      },
      {
        heading: "Exportar",
        body: "Você escolhe Ano Inteiro ou Período Personalizado, o ano de referência ou as datas, e a origem das transações. O arquivo sai com o que estiver filtrado.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O painel financeiro",
        text: "Transações, métricas, saldo dos gateways e o cálculo de imposto. Tudo respeita os filtros da barra superior.",
      },
      {
        id: "actions",
        target: "admin-finances.actions",
        title: "O menu de ações",
        text: "O botão com três pontos reúne Configuração Fiscal (tabelas de imposto), Exportar (arquivo do período), Previsões (a projeção item a item) e Pacotes (planos). Ao lado dele, Nova Transação lança uma receita ou despesa manual.",
      },
      {
        id: "transactions",
        target: "admin-finances.table",
        title: "As transações",
        text: "A lista do período filtrado. Clique numa linha para editar ou anexar comprovante.",
      },
      {
        id: "auto",
        title: "Pagamento de professor entra sozinho",
        text: "O fechamento dos professores vira despesa automaticamente a partir das aulas registradas. Lançar à mão duplica o valor no resultado.",
      },
      {
        id: "mei",
        target: "admin-finances.fiscal",
        title: "Imposto e capacidade MEI",
        text: "O IRPF estimado usa as tabelas da Configuração Fiscal, que mudam por ano. O medidor de MEI mostra quanto do teto anual já foi consumido — serve para antecipar a mudança de regime, não para descobrir depois.",
      },
    ],
  },

  "/hub/admin/finances/forecast": {
    title: "Previsões",
    summary:
      "Quanto ainda deve entrar e sair no período, item por item, com nome e vencimento.",
    docsArticleId: "financeiro-previsoes",
    sections: [
      {
        heading: "Receita Projetada",
        body: "As mensalidades pendentes do período, uma linha por parcela: estudante, plano, vencimento, valor e qual parcela é. É o detalhamento do A Receber que aparece no dashboard.",
      },
      {
        heading: "Despesas Pendentes",
        body: "As contas ainda não pagas do período, no mesmo formato.",
      },
      {
        heading: "Projeção não é caixa",
        body: "Tudo aqui é o que deveria acontecer se todo mundo pagar em dia. Usar estes números como disponível é o erro que quebra o fluxo de caixa.",
      },
      {
        heading: "Para que serve na prática",
        body: "Ver nome a nome quem forma o valor previsto. É a lista de onde sai a régua de cobrança do mês.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A projeção detalhada",
        text: "O que ainda deve entrar e sair no período, item por item — o detalhamento do A Receber do dashboard.",
      },
      {
        id: "revenue",
        target: "admin-forecast.revenue",
        title: "Receita Projetada",
        text: "Uma linha por parcela pendente, com estudante, plano, vencimento, valor e número da parcela. É daqui que sai a régua de cobrança do mês.",
      },
      {
        id: "expenses",
        target: "admin-forecast.expenses",
        title: "Despesas Pendentes",
        text: "As contas ainda não pagas do período, no mesmo formato.",
      },
      {
        id: "warning",
        title: "Projeção não é caixa",
        text: "Estes números assumem que todo mundo paga em dia. Tratá-los como disponível é o erro que quebra o fluxo de caixa.",
      },
    ],
  },

  "/hub/admin/finances/plans": {
    title: "Pacotes",
    summary: "Os planos de assinatura vendidos aos alunos: criar, editar, ativar e excluir.",
    docsArticleId: "financeiro-planos",
    sections: [
      {
        heading: "Os campos de um pacote",
        body: [
          "Nome do Plano é como ele aparece na matrícula.",
          "Idioma define a língua do plano.",
          "Aulas por Semana e Duração (Meses) formam a estrutura do pacote.",
          "Mensalidade é o valor cobrado.",
          "Descrição é opcional.",
        ],
      },
      {
        heading: "Os botões",
        body: [
          "Novo pacote cria um plano. Planos em reais são espelhados como produto na AbacatePay; em dólar, usam o Stripe.",
          "O lápis edita nome, preço e configurações.",
          "Ativar / Desativar controla se o pacote aparece como opção em matrículas novas.",
          "A lixeira exclui o plano definitivamente.",
        ],
      },
      {
        heading: "Mudar o preço não muda quem já assinou",
        body: "Parcelas já geradas continuam no valor antigo, e alunos existentes seguem no preço que contrataram até você trocar o plano deles individualmente. Editar o pacote afeta apenas as matrículas novas.",
      },
      {
        heading: "Desativar em vez de excluir",
        body: "A exclusão só funciona se nenhum aluno estiver vinculado ao plano — com matrícula associada, o sistema recusa. Para tirar um pacote de circulação sem mexer em quem já assinou, desative.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Os planos vendidos",
        text: "Os pacotes que aparecem na matrícula. Planos em reais vão para a AbacatePay; em dólar, para o Stripe.",
      },
      {
        id: "new",
        target: "admin-plans.new",
        title: "Novo pacote",
        text: "Nome, idioma, aulas por semana, duração em meses e mensalidade. Ao salvar, o plano é espelhado como produto no gateway correspondente.",
      },
      {
        id: "list",
        target: "admin-plans.list",
        title: "Os pacotes",
        text: "O lápis edita, a chave ativa ou desativa e a lixeira exclui. Desativar tira o plano da vitrine sem afetar quem já assinou.",
      },
      {
        id: "price",
        title: "Mudar o preço não muda quem já assinou",
        text: "Parcelas geradas ficam no valor antigo, e alunos existentes seguem no preço contratado até você trocar o plano deles um a um. Editar afeta só matrículas novas.",
      },
      {
        id: "delete",
        title: "Prefira desativar",
        text: "Excluir só funciona sem nenhum aluno vinculado; havendo matrícula, o sistema recusa. É proteção, não erro.",
      },
    ],
  },

  "/hub/admin/contracts": {
    title: "Contratos",
    summary:
      "Os modelos de contrato, as assinaturas geradas e os dados jurídicos da escola.",
    docsArticleId: "contratos-modelos",
    sections: [
      {
        heading: "Templates Disponíveis",
        body: "A tabela dos modelos, com nome, região, destinatário, tipo de assinatura, versão e situação. Apenas um modelo fica Ativo por combinação de destinatário e região.",
      },
      {
        heading: "Os botões dos templates",
        body: [
          "Criar Template publica um modelo novo. Para a mesma combinação de destinatário e região, o novo entra como ativo e os anteriores são desativados automaticamente.",
          "Criar Nova Versão duplica o modelo aberto já preenchido, para você editar e salvar como a versão seguinte. Preserva o histórico: contratos já assinados continuam apontando para a versão vigente na época.",
          "Visualizar Modelo abre a prévia.",
          "Ativar torna aquele modelo o vigente para a combinação dele.",
          "Excluir só funciona se o modelo não estiver ativo e não tiver assinatura vinculada — é proteção contra perder registro jurídico.",
        ],
      },
      {
        heading: "Contratos Gerados e Assinados",
        body: "A outra tabela lista as assinaturas, com usuário, template, situação (Assinado, Pendente, Cancelado, Expirado) e as datas de geração e de assinatura.",
      },
      {
        heading: "Os botões das assinaturas",
        body: [
          "Baixar PDF abre o documento assinado numa aba nova. O link é temporário e vale uma hora — é o que evita que o documento fique público na internet.",
          "Reenviar Contrato manda de novo o e-mail com o contrato anexado.",
          "Verificar Assinatura confere a validade do documento.",
        ],
      },
      {
        heading: "Corrigir os dados da escola não corrige o passado",
        body: "As informações jurídicas entram em todo contrato no momento em que ele é gerado. Ajustar um dado errado aqui vale para os próximos — os já assinados continuam com o texto antigo.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Contratos da escola",
        text: "Duas tabelas: os modelos e as assinaturas já geradas. Mais os dados jurídicos que entram em todo contrato.",
      },
      {
        id: "templates",
        target: "admin-contracts.templates",
        title: "Templates Disponíveis",
        text: "Um modelo Ativo por combinação de destinatário e região. Criar Template para a mesma combinação desativa os anteriores automaticamente.",
      },
      {
        id: "version",
        target: "admin-contracts.templates",
        title: "Criar Nova Versão",
        text: "Duplica o modelo já preenchido para você editar e salvar como a versão seguinte. Preserva o histórico: contrato assinado continua apontando para a versão vigente na época.",
      },
      {
        id: "instances",
        target: "admin-contracts.instances",
        title: "Contratos Gerados e Assinados",
        text: "Usuário, template, situação e datas. Baixar PDF gera um link temporário de uma hora; Reenviar Contrato manda o e-mail de novo.",
      },
      {
        id: "school",
        title: "Corrigir dados da escola não corrige o passado",
        text: "Os dados jurídicos entram no contrato no momento em que ele é gerado. Ajuste agora vale para os próximos; os assinados mantêm o texto antigo.",
      },
    ],
  },

  "/hub/admin/courses": {
    title: "Cursos",
    summary: "O catálogo de cursos em vídeo: criar, publicar e controlar o que os alunos veem.",
    docsArticleId: "cursos-catalogo",
    sections: [
      {
        heading: "Criar curso",
        body: "O formulário pede título, descrição, idioma e imagem de capa. O curso nasce como rascunho — invisível para os alunos até você publicar.",
      },
      {
        heading: "O menu de cada curso",
        body: [
          "Editar ajusta os dados e a capa.",
          "Publicar / Despublicar controla a visibilidade para os alunos. Despublicar esconde da vitrine mas mantém o progresso de quem já estava fazendo.",
          "Excluir remove o curso e todo o conteúdo dele.",
        ],
      },
      {
        heading: "Excluir é destrutivo",
        body: "Seções, lições e o progresso dos alunos vão junto e não voltam. Se a intenção é apenas tirar do ar, use Despublicar.",
      },
      {
        heading: "Publique só quando estiver pronto",
        body: "Curso publicado pela metade aparece na vitrine do aluno como se estivesse completo. Deixe em rascunho até o conteúdo fechar.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O catálogo de cursos",
        text: "Os cursos em vídeo da escola. Todo curso nasce como rascunho, invisível para os alunos.",
      },
      {
        id: "create",
        target: "admin-courses.create",
        title: "Criar curso",
        text: "Título, descrição, idioma e imagem de capa. Ele nasce em rascunho — publicar é um passo separado e consciente.",
      },
      {
        id: "list",
        target: "admin-courses.list",
        title: "Os cursos",
        text: "O menu de cada cartão traz Editar, Publicar / Despublicar e Excluir. Despublicar esconde da vitrine mas preserva o progresso de quem já estava fazendo.",
      },
      {
        id: "delete",
        title: "Excluir é destrutivo",
        text: "Seções, lições e o progresso dos alunos vão junto e não voltam. Para só tirar do ar, use Despublicar.",
      },
    ],
  },

  "/hub/admin/courses/[id]": {
    title: "Conteúdo do curso",
    summary: "As seções e as aulas de um curso, na ordem em que o aluno vai percorrer.",
    docsArticleId: "cursos-conteudo",
    sections: [
      {
        heading: "Como o curso é montado",
        body: "Um curso tem seções, e cada seção tem aulas. Você cria as seções na ordem do conteúdo e adiciona as aulas dentro de cada uma.",
      },
      {
        heading: "Os botões",
        body: [
          "Nova Seção cria um agrupamento, pedindo o título.",
          "Nova Aula cria uma aula dentro da seção, pedindo o título.",
          "A alça de arrastar reordena seções e aulas.",
          "O olho mostra ou esconde um item.",
          "Editar Conteúdo abre o editor da aula.",
        ],
      },
      {
        heading: "A ordem é a que o aluno vê",
        body: "A sequência montada aqui é exatamente a sequência do player do aluno. Vale revisar a ordem antes de publicar.",
      },
      {
        heading: "Seção vazia",
        body: "Seção sem aula aparece para o aluno como um bloco vazio. Ou adicione a primeira aula, ou remova a seção antes de publicar.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Montando o curso",
        text: "Seções agrupam aulas. Você cria as seções na ordem do conteúdo e coloca as aulas dentro de cada uma.",
      },
      {
        id: "sections",
        target: "admin-course-detail.sections",
        title: "Seções e aulas",
        text: "Nova Seção cria um agrupamento; Nova Aula cria uma aula dentro dele. A alça de arrastar reordena e o olho mostra ou esconde um item.",
      },
      {
        id: "edit",
        target: "admin-course-detail.sections",
        title: "Editar Conteúdo",
        text: "Abre o editor da aula, onde entram os blocos de vídeo e de texto e o quiz.",
      },
      {
        id: "order",
        title: "A ordem é a que o aluno vê",
        text: "A sequência montada aqui é exatamente a do player do aluno. Seção sem aula aparece como bloco vazio — preencha ou remova antes de publicar.",
      },
    ],
  },

  "/hub/admin/courses/[id]/lessons/[lessonId]": {
    title: "Editor de Aula",
    summary: "O conteúdo de uma aula do curso: blocos de vídeo e texto, e a avaliação.",
    docsArticleId: "cursos-conteudo",
    sections: [
      {
        heading: "As abas",
        body: [
          "Conteúdo é onde entram os blocos de vídeo e de texto.",
          "Avaliação é o quiz que o aluno responde ao final da aula.",
          "Visualizar mostra a aula como o aluno vai ver.",
        ],
      },
      {
        heading: "Blocos de conteúdo",
        body: [
          "Adicionar Vídeo aceita link do YouTube ou do Google Drive.",
          "Adicionar Texto abre um editor de texto formatado.",
          "Os blocos aparecem para o aluno na ordem em que você os coloca — dá para intercalar vídeo e texto.",
        ],
      },
      {
        heading: "Configurações da aula",
        body: "Título da Aula é obrigatório. Duração (minutos) é o tempo estimado que aparece para o aluno.",
      },
      {
        heading: "Salvar Alterações",
        body: "O quiz e o conteúdo são salvos juntos. Sair sem salvar perde o que você montou desde o último salvamento.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O editor da aula",
        text: "Aqui entram o conteúdo que o aluno consome e a avaliação do final.",
      },
      {
        id: "tabs",
        target: "admin-lesson-editor.tabs",
        title: "Conteúdo, Avaliação e Visualizar",
        text: "Conteúdo tem os blocos de vídeo e texto. Avaliação é o quiz do final. Visualizar mostra a aula como o aluno vai ver — vale conferir antes de publicar o curso.",
      },
      {
        id: "blocks",
        target: "admin-lesson-editor.blocks",
        title: "Blocos de conteúdo",
        text: "Adicionar Vídeo aceita link do YouTube ou do Google Drive; Adicionar Texto abre o editor formatado. Os blocos aparecem na ordem em que você os coloca, e dá para intercalar.",
      },
      {
        id: "save",
        target: "admin-lesson-editor.save",
        title: "Salvar Alterações",
        text: "Salva conteúdo e quiz juntos. Sair sem salvar perde o que foi montado desde o último salvamento.",
      },
    ],
  },

  "/hub/admin/my-courses": {
    title: "Meu Aprendizado",
    summary: "A visão de aluno, para você mesmo consumir os cursos da escola.",
    docsArticleId: "meu-aprendizado",
    sections: [
      {
        heading: "O que fica aqui",
        body: "Os cursos liberados para a sua conta, exatamente como um aluno os vê. Funciona igual: seções, lições e progresso salvo automaticamente.",
      },
      {
        heading: "Para que serve na prática",
        body: "É a forma mais direta de conferir como um curso ficou antes de anunciá-lo — ver com os olhos do aluno costuma revelar o que a tela de edição esconde.",
      },
      {
        heading: "Não é o catálogo",
        body: "Criar e publicar cursos acontece em Cursos. Aqui você só consome.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A visão de aluno",
        text: "Os cursos como um aluno os vê. É a forma mais direta de conferir como um curso ficou antes de anunciá-lo.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "Seus cursos",
        text: "Cada cartão é um curso liberado para a sua conta, com o progresso já feito. Toque para abrir.",
      },
      {
        id: "catalog",
        title: "Não é o catálogo",
        text: "Criar, editar e publicar acontecem em Cursos. Aqui você só consome.",
      },
    ],
  },

  "/hub/admin/my-courses/[id]": {
    title: "Assistindo ao curso",
    summary: "O player do curso, exatamente como o aluno vê.",
    docsArticleId: "meu-aprendizado",
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
        heading: "É aqui que os erros aparecem",
        body: "Vídeo que não carrega, bloco de texto fora de ordem, quiz com resposta errada marcada — tudo isso salta nesta tela e não na de edição. Vale percorrer um curso novo inteiro antes de publicar.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O player do curso",
        text: "A experiência exata do aluno. É onde os erros de montagem aparecem.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "A lição",
        text: "Vídeo, texto ou os dois. Quando a lição não tem conteúdo publicado, a tela avisa — o aluno vê esse mesmo aviso.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "As lições do curso",
        text: "A lista completa, por seção, com as concluídas marcadas. É a ordem que você montou na tela de conteúdo do curso.",
      },
      {
        id: "review",
        title: "Percorra antes de publicar",
        text: "Vídeo que não carrega, texto fora de ordem, quiz com resposta errada marcada — tudo isso salta aqui e não na tela de edição.",
      },
    ],
  },

  "/hub/admin/tasks": {
    title: "Tarefas",
    summary: "O gestor de tarefas e projetos da equipe, em lista ou em quadro kanban.",
    docsArticleId: "tarefas",
    sections: [
      {
        heading: "Projetos e caixa de entrada",
        body: "O menu lateral lista os projetos. Cada projeto tem o seu próprio fluxo de colunas de status. Tarefas sem projeto ficam na caixa de entrada.",
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
          "Projeto e Coluna definem onde ela nasce; sem projeto, vai para a caixa de entrada.",
          "Data de Entrega é o prazo.",
          "Responsáveis atribui a tarefa a pessoas da equipe.",
          "Tarefa Recorrente recria a tarefa automaticamente a cada ciclo.",
        ],
      },
      {
        heading: "Onde o recorrente ajuda",
        body: "Rotinas de admin que se repetem — conferir parcelas vencidas, atualizar a tabela fiscal no começo do ano, revisar perfis de onboarding parados — são exatamente o caso de uso da tarefa recorrente.",
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
        text: "O menu lateral lista os projetos. Tarefa sem projeto fica na caixa de entrada. Como cada projeto tem colunas próprias, vale separar frentes.",
      },
      {
        id: "views",
        target: "tasks.views",
        title: "Lista e Kanban",
        text: "Lista é melhor para varrer o pendente; Kanban, para ver onde travou. No celular, o botão ao lado do + alterna entre as duas.",
      },
      {
        id: "new",
        target: "tasks.new",
        title: "Nova tarefa",
        text: "Título, descrição, projeto e coluna, prazo e responsáveis. A chave Tarefa Recorrente serve para as rotinas de admin: conferir parcelas vencidas, atualizar a tabela fiscal, revisar onboardings parados.",
      },
    ],
  },

  "/hub/admin/procedures": {
    title: "Procedimentos",
    summary:
      "A base de procedimentos operacionais padrão (POP) escrita pela equipe.",
    docsArticleId: "procedimentos",
    sections: [
      {
        heading: "O que é um POP",
        body: "Um procedimento operacional padrão: o passo a passo de como a escola faz algo. É o que permite outra pessoa executar a tarefa do mesmo jeito.",
      },
      {
        heading: "Os botões",
        body: [
          "Novo POP cria um procedimento, pedindo o título e abrindo o editor de texto formatado.",
          "Buscar procedimentos filtra a lista pelo título.",
          "A lixeira exclui — e não há como desfazer.",
        ],
      },
      {
        heading: "O que rende um bom POP",
        body: "As rotinas que hoje só uma pessoa sabe fazer: como realizar uma matrícula, o que conferir antes de confirmar pagamento na mão, como conduzir um pedido de cancelamento. Se alguém já perguntou duas vezes, vira POP.",
      },
      {
        heading: "Exclusão é definitiva",
        body: "O conteúdo é perdido, sem lixeira e sem recuperação. Na dúvida, esvazie o texto e mantenha o registro em vez de excluir.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Os procedimentos da escola",
        text: "A base de POPs: o passo a passo de como a escola faz cada coisa, escrito pela própria equipe.",
      },
      {
        id: "new",
        target: "admin-procedures.new",
        title: "Novo POP",
        text: "Pede o título e abre o editor de texto formatado. Boa regra: se alguém já perguntou a mesma coisa duas vezes, vira POP.",
      },
      {
        id: "search",
        target: "admin-procedures.search",
        title: "Buscar procedimentos",
        text: "Filtra a lista pelo título. Vale nomear os POPs pela pergunta que eles respondem.",
      },
      {
        id: "delete",
        title: "Exclusão é definitiva",
        text: "A lixeira apaga sem desfazer e sem recuperação. Na dúvida, esvazie o texto e mantenha o registro.",
      },
    ],
  },

  "/hub/admin/procedures/[id]": {
    title: "Procedimento",
    summary: "O conteúdo de um POP, para ler ou editar.",
    docsArticleId: "procedimentos",
    sections: [
      {
        heading: "Ler e editar",
        body: "A tela abre em leitura. O botão de editar libera o texto, e o de salvar grava por cima da versão anterior.",
      },
      {
        heading: "O editor",
        body: "Aceita texto formatado: títulos, listas, negrito e links. Estrutura em passos numerados funciona melhor que parágrafo corrido para quem vai executar.",
      },
      {
        heading: "Não há histórico de versões",
        body: "Salvar substitui o conteúdo anterior sem guardar o que havia antes. Para uma reescrita grande, vale copiar o texto atual para algum lugar antes.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O procedimento",
        text: "A tela abre em leitura. Editar libera o texto e salvar grava por cima.",
      },
      {
        id: "editor",
        target: "admin-procedure.editor",
        title: "O editor",
        text: "Aceita títulos, listas, negrito e links. Passos numerados funcionam melhor que parágrafo corrido para quem vai executar.",
      },
      {
        id: "versions",
        title: "Não há histórico de versões",
        text: "Salvar substitui o conteúdo anterior sem guardar o antigo. Antes de uma reescrita grande, copie o texto atual para algum lugar.",
      },
    ],
  },

  "/hub/admin/communication": {
    title: "Comunicação",
    summary:
      "Notificações para a base, templates de WhatsApp e o histórico de e-mails enviados.",
    docsArticleId: "comunicacao-notificacoes",
    sections: [
      {
        heading: "Enviar notificação",
        body: [
          "Título e Mensagem formam o aviso.",
          "Público-Alvo escolhe entre toda a base ou pessoas específicas, buscadas por nome.",
          "O envio sai como push e como notificação interna na plataforma.",
        ],
      },
      {
        heading: "Não dá para desenviar",
        body: "Notificação disparada chega no aparelho das pessoas na hora. Não existe cancelar nem editar depois. Revise o texto e o público antes de confirmar.",
      },
      {
        heading: "Templates de WhatsApp",
        body: [
          "Criar template submete um modelo novo para aprovação da Meta. Ele nasce pendente e pode levar horas para ser aprovado ou rejeitado.",
          "Atualizar templates puxa da Meta a lista com a situação mais recente de cada modelo.",
          "Enviar mensagem dispara um template já aprovado para um aluno.",
          "Excluir remove o template da conta.",
        ],
      },
      {
        heading: "Cuidado ao excluir template",
        body: "Templates usados por rotinas automáticas — lembrete de pagamento, boas-vindas — não devem ser excluídos: os avisos automáticos param de sair, e isso só aparece dias depois.",
      },
      {
        heading: "Histórico de e-mails",
        body: "Lista o que foi enviado, com data e conteúdo. É onde você confere se um e-mail realmente saiu quando o aluno diz que não recebeu.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "A comunicação com a base",
        text: "Notificações push, templates de WhatsApp e o histórico de e-mails, tudo numa tela.",
      },
      {
        id: "notify",
        target: "admin-communication.notify",
        title: "Enviar notificação",
        text: "Título, mensagem e público — toda a base ou pessoas específicas. Sai como push e como notificação interna.",
      },
      {
        id: "no-undo",
        title: "Não dá para desenviar",
        text: "Notificação disparada chega no aparelho das pessoas na hora, sem cancelar nem editar depois. Revise o texto e o público antes de confirmar.",
      },
      {
        id: "templates",
        target: "admin-communication.templates",
        title: "Templates de WhatsApp",
        text: "Criar template submete à Meta, que leva horas para aprovar. Atualizar templates puxa a situação mais recente. Enviar mensagem dispara um aprovado.",
      },
      {
        id: "template-warning",
        title: "Cuidado ao excluir template",
        text: "Os usados por rotinas automáticas — lembrete de pagamento, boas-vindas — fazem os avisos automáticos pararem de sair, e isso só aparece dias depois.",
      },
      {
        id: "emails",
        target: "admin-communication.emails",
        title: "Histórico de e-mails",
        text: "O que foi enviado, com data e conteúdo. É aqui que você confere quando o aluno diz que não recebeu.",
      },
    ],
  },

  "/hub/admin/conversas": {
    title: "Conversas",
    summary:
      "A caixa de entrada do WhatsApp oficial da escola, para falar direto com os alunos.",
    docsArticleId: "conversas",
    sections: [
      {
        heading: "Como funciona",
        body: "As mensagens dos alunos chegam aqui em tempo real, e a sua resposta sai pelo número oficial da escola. A lista da esquerda são as conversas; a busca acima dela procura por conversa ou por atalho.",
      },
      {
        heading: "A janela de 24 horas",
        body: "Você escreve livremente enquanto estiver dentro de 24 horas desde a última mensagem do aluno. Passado esse prazo, só é possível iniciar contato com um template aprovado. É regra da Meta, não da plataforma.",
      },
      {
        heading: "Os botões da conversa",
        body: [
          "O + no topo da lista abre uma conversa nova por template — o caminho para quem está fora da janela de 24 horas.",
          "O clipe envia foto, áudio ou documento.",
          "Digitar / no campo de mensagem abre as respostas rápidas.",
          "Tocar no nome do contato abre os detalhes e as etiquetas dele.",
        ],
      },
      {
        heading: "Os templates ficam em Comunicação",
        body: "Criar e submeter um template novo à Meta acontece na tela de Comunicação. Aqui você apenas usa os já aprovados.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O WhatsApp da escola",
        text: "As mensagens dos alunos chegam aqui, e sua resposta sai pelo número oficial.",
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
        text: "Dentro de 24 horas desde a última mensagem do aluno você escreve livremente. Passado isso, só template aprovado — regra da Meta, não da plataforma.",
      },
      {
        id: "quick",
        target: "conversas.composer",
        title: "Respostas rápidas",
        text: "Digite / no campo de mensagem para abrir os atalhos de texto pronto. O clipe ao lado envia foto, áudio ou documento.",
      },
    ],
  },

  "/hub/admin/settings": {
    panel: "wizard",
    title: "Configurações",
    summary:
      "Sua conta, a segurança dela e as configurações globais da plataforma.",
    docsArticleId: "config-conta",
    tour: [
      {
        id: "intro",
        title: "As configurações",
        text: "As cinco abas comuns a todo mundo, mais duas que só o admin vê: Plataforma e WhatsApp.",
      },
      {
        id: "tabs",
        target: "settings.tabs",
        title: "As abas",
        text: "Conta, Aparência, Notificações, Segurança e Aplicativo aparecem para todos. Plataforma e WhatsApp são exclusivas do admin e mexem em configuração global.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Aba Segurança — ative o 2FA",
        text: "Sua conta alcança dados pessoais e financeiros de toda a base, e executa ações irreversíveis. A verificação em duas etapas é a proteção mais efetiva contra acesso indevido.",
      },
      {
        id: "platform",
        target: "settings.tabs",
        title: "Aba Plataforma",
        text: "Configurações globais como e-mail de suporte e número de contato da escola. Mudanças aqui valem para todos os usuários — confira antes de salvar.",
      },
      {
        id: "whatsapp",
        target: "settings.tabs",
        title: "Aba WhatsApp",
        text: "A integração com o WhatsApp da escola. É o que faz a tela de Conversas e os avisos automáticos funcionarem.",
      },
    ],
  },

  "/hub/admin/docs": {
    title: "Central de Ajuda",
    summary:
      "O guia completo da plataforma para admins, incluindo o que o sistema faz sozinho.",
    sections: [
      {
        heading: "O que tem aqui",
        body: "Os guias completos, por assunto: primeiros passos, dashboard, usuários, financeiro, contratos, cursos, comunicação, operação interna, configurações e solução de problemas.",
      },
      {
        heading: "Duas leituras que economizam tempo",
        body: [
          "O que o sistema faz sozinho: as rotinas agendadas (cron) e os webhooks que rodam sem ninguém clicar. Saber isso evita lançar na mão o que já entra automaticamente.",
          "Modo sudo: quais ações pedem sua senha de novo, e por quê — inclusive o limite de tentativas.",
        ],
      },
      {
        heading: "Solução de problemas",
        body: "Os quatro casos mais frequentes: aluno pagou e continua pendente, usuário não consegue entrar, PIX venceu ou não abre, e aluno diz que não recebeu o aviso.",
      },
      {
        heading: "Perguntas à IA",
        body: "O que os usuários perguntam ao assistente da Central de Ajuda fica registrado. A tela de Perguntas mostra o que ficou sem resposta na documentação — é a lista do que falta escrever.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O guia completo",
        text: "A versão longa da ajuda do admin, incluindo o que o sistema executa sozinho por cron e webhook.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "A busca",
        text: "Procura dentro de todo o texto dos artigos. Busque pelo sintoma, como o PIX venceu.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "Os assuntos",
        text: "Primeiros passos, dashboard, usuários, financeiro, contratos, cursos, comunicação, operação e solução de problemas. Vale ler Primeiros Passos inteiro uma vez.",
      },
      {
        id: "ask",
        target: "docs.ask",
        title: "Perguntar",
        text: "As perguntas feitas aqui ficam registradas. A tela de Perguntas mostra o que ficou sem resposta — é a lista do que falta documentar.",
      },
    ],
  },

  "/hub/admin/docs/questions": {
    title: "Perguntas à IA",
    summary:
      "O que os usuários perguntaram ao assistente da Central de Ajuda — e o que ficou sem resposta.",
    sections: [
      {
        heading: "Os três números do topo",
        body: [
          "Perguntas feitas: o total no período.",
          "Sem resposta na doc: quantas a IA não conseguiu responder com o material existente.",
          "Marcadas como ruins: quantas receberam polegar para baixo de quem perguntou.",
        ],
      },
      {
        heading: "Para que serve esta tela",
        body: "É a pauta do que falta documentar. Cada pergunta sem resposta é um buraco na Central de Ajuda que alguém já tentou preencher sozinho e não conseguiu.",
      },
      {
        heading: "Como usar na prática",
        body: "Comece pelas sem resposta na doc, depois pelas marcadas como ruins — essas últimas costumam indicar artigo existente mas confuso, não conteúdo faltando.",
      },
      {
        heading: "Onde o conteúdo é escrito",
        body: "Os artigos da Central de Ajuda vivem no código, em modules/docs. A ajuda curta que aparece no (?) de cada página vive em modules/page-help. Uma dúvida recorrente costuma merecer os dois.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O que as pessoas perguntam",
        text: "As perguntas feitas ao assistente da Central de Ajuda, e quais delas ficaram sem resposta.",
      },
      {
        id: "stats",
        target: "admin-questions.stats",
        title: "Os três números",
        text: "Perguntas feitas no período, quantas ficaram sem resposta na documentação e quantas foram marcadas como ruins por quem perguntou.",
      },
      {
        id: "list",
        target: "admin-questions.list",
        title: "As perguntas",
        text: "Cada linha é uma pergunta real. Comece pelas sem resposta: são buracos que alguém já tentou preencher sozinho e não conseguiu.",
      },
      {
        id: "bad",
        title: "Marcada como ruim é outro sinal",
        text: "Costuma indicar artigo que existe mas está confuso, não conteúdo faltando. O conserto é reescrever, não escrever de novo.",
      },
    ],
  },
};
