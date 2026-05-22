export const emailTranslations = {
  welcome: {
    pt: {
      subject: "Bem-vindo(a) à Fluency Lab! 🎉",
      heading: "Bem-vindo(a) à Fluency Lab! 🎉",
      success: "Sua conta foi criada com sucesso! Estamos muito felizes em ter você conosco.",
      studentInfo: (name: string) => `Uma conta foi criada para o aluno(a) ${name}. Você já pode acessar a plataforma para gerenciar as aulas.`,
      instruction: "Para começar, defina sua senha segura clicando abaixo:",
      button: "Definir Minha Senha",
    },
    en: {
      subject: "Welcome to Fluency Lab! 🎉",
      heading: "Welcome to Fluency Lab! 🎉",
      success: "Your account was successfully created! We are thrilled to have you with us.",
      studentInfo: (name: string) => `An account has been created for student ${name}. You can now access the platform to manage classes.`,
      instruction: "To get started, set your secure password by clicking below:",
      button: "Set My Password",
    }
  },
  resendInvite: {
    pt: {
      subject: "Novo link de acesso disponível! 🚀",
      heading: "Novo link de acesso disponível! 🚀",
      body: "Conforme solicitado, estamos enviando um novo link para você definir sua senha e acessar sua conta na Fluency Lab.",
      instruction: "Este link é temporário. Clique no botão abaixo para criar sua senha:",
      button: "Definir Minha Senha",
      footerParagraph: "Se você não solicitou este link, pode ignorar este e-mail com segurança.",
    },
    en: {
      subject: "New access link available! 🚀",
      heading: "New access link available! 🚀",
      body: "As requested, we are sending a new link for you to set your password and access your Fluency Lab account.",
      instruction: "This link is temporary. Click the button below to create your password:",
      button: "Set My Password",
      footerParagraph: "If you did not request this link, you can safely ignore this email.",
    }
  },
  paymentConfirmed: {
    pt: {
      subject: "✅ Pagamento confirmado! Boas aulas.",
      preview: "Pagamento confirmado! 🚀",
      heading: "Olá",
      body: (amount: string) => `Ótimas notícias! Seu pagamento de ${amount} foi recebido com sucesso.`,
      body2: "Sua assinatura continua ativa e você pode continuar focando nos seus estudos.",
      footer: "Equipe Fluency Lab",
    },
    en: {
      subject: "✅ Payment confirmed! Have a great class.",
      preview: "Payment confirmed! 🚀",
      heading: "Hello",
      body: (amount: string) => `Great news! Your payment of ${amount} was successfully received.`,
      body2: "Your subscription remains active, and you can keep focusing on your studies.",
      footer: "Fluency Lab Team",
    }
  },
  newInvoice: {
    pt: {
      subject: "📄 Sua fatura da Fluency Lab está disponível",
      preview: "Sua fatura está disponível! 📄",
      hello: "Olá",
      description: (amount: string, desc: string) => `Uma nova cobrança no valor de ${amount} foi gerada referente a: ${desc}.`,
      noDescription: (amount: string) => `Sua próxima mensalidade no valor de ${amount} já está disponível.`,
      dueDateText: (dueDate: string) => `O vencimento é dia ${dueDate}. Você pode realizar o pagamento via PIX utilizando o QR Code abaixo:`,
      copyPasteText: "Ou utilize o código Copia e Cola abaixo:",
      questions: "Se tiver qualquer dúvida, estamos à disposição.",
      footer: "Equipe Fluency Lab",
    },
    en: {
      subject: "📄 Your Fluency Lab invoice is available",
      preview: "Your invoice is available! 📄",
      hello: "Hello",
      description: (amount: string, desc: string) => `A new charge of ${amount} has been generated for: ${desc}.`,
      noDescription: (amount: string) => `Your next monthly fee of ${amount} is now available.`,
      dueDateText: (dueDate: string) => `The due date is ${dueDate}. You can make the payment via PIX using the QR Code below:`,
      copyPasteText: "Or use the Copy and Paste code below:",
      questions: "If you have any questions, we are here to help.",
      footer: "Fluency Lab Team",
    }
  },
  billingReminder: {
    pt: {
      subject: "⏳ Lembrete: Sua fatura vence em 2 dias",
      preview: "Lembrete: Sua mensalidade vence em 2 dias! ⏳",
      heading: "Falta pouco",
      body: (amount: string, dueDate: string) => `Passando para lembrar que sua mensalidade no valor de ${amount} vence daqui a 2 dias (${dueDate}).`,
      body2: "Para evitar qualquer interrupção ou cobrança de multa, você já pode realizar o pagamento clicando no botão abaixo:",
      button: "Pagar Agora",
      footerParagraph: "Se você já realizou o pagamento, por favor desconsidere este aviso.",
      footer: "Equipe Fluency Lab",
    },
    en: {
      subject: "⏳ Reminder: Your invoice is due in 2 days",
      preview: "Reminder: Your subscription is due in 2 days! ⏳",
      heading: "Almost there",
      body: (amount: string, dueDate: string) => `Just a friendly reminder that your monthly subscription of ${amount} is due in 2 days (${dueDate}).`,
      body2: "To avoid any interruption or late fees, you can make your payment now by clicking the button below:",
      button: "Pay Now",
      footerParagraph: "If you have already made the payment, please ignore this notice.",
      footer: "Fluency Lab Team",
    }
  },
  billingDueDate: {
    pt: {
      subject: "⏳ Atenção: Sua fatura vence hoje",
      preview: "Atenção: Sua mensalidade vence hoje! 📅",
      heading: "Dia de vencimento",
      body: (amount: string) => `Sua mensalidade no valor de ${amount} vence hoje.`,
      body2: "Para garantir que seu acesso às aulas continue ativo sem interrupções, realize o pagamento agora clicando no botão abaixo:",
      button: "Pagar Agora",
      footerParagraph: "O acesso imediato é garantido após a confirmação do pagamento via PIX.",
      footer: "Equipe Fluency Lab",
    },
    en: {
      subject: "⏳ Attention: Your invoice is due today",
      preview: "Attention: Your monthly subscription is due today! 📅",
      heading: "Due day",
      body: (amount: string) => `Your monthly subscription of ${amount} is due today.`,
      body2: "To ensure that your access to classes remains active without interruptions, make your payment now by clicking the button below:",
      button: "Pay Now",
      footerParagraph: "Immediate access is guaranteed upon payment confirmation via PIX.",
      footer: "Fluency Lab Team",
    }
  },
  billingOverdue: {
    pt: {
      subject: "⚠️ Sua fatura está em atraso",
      preview: "⚠️ Sua mensalidade está atrasada",
      heading: "Fatura em atraso",
      body: (amount: string) => `Notamos que o pagamento da sua mensalidade no valor de ${amount} ainda não foi identificado.`,
      body2: "A sua conta poderá ser suspensa em breve se o pagamento não for regularizado. Por favor, utilize o botão abaixo para quitar seu débito agora via PIX ou Cartão:",
      button: "Regularizar Pagamento",
      footerParagraph: "Caso já tenha realizado o pagamento, favor ignorar este e-mail. A compensação do boleto ou cartão pode levar até 48h (PIX é instantâneo).",
      footer: "Equipe Fluency Lab",
    },
    en: {
      subject: "⚠️ Your invoice is overdue",
      preview: "⚠️ Your subscription is overdue",
      heading: "Invoice overdue",
      body: (amount: string) => `We noticed that the payment for your monthly subscription of ${amount} has not been identified yet.`,
      body2: "Your account may be suspended soon if the payment is not settled. Please use the button below to clear your debt now via PIX or Credit Card:",
      button: "Settle Payment",
      footerParagraph: "If you have already made the payment, please ignore this email. Processing for bank slips or cards can take up to 48 hours (PIX is instant).",
      footer: "Fluency Lab Team",
    }
  },
  farewell: {
    pt: {
      subject: "Sentiremos sua falta! 👋",
      heading: "Sentiremos sua falta! 👋",
      body1: "Confirmamos o cancelamento da sua conta na Fluency Lab conforme solicitado.",
      body2: "Foi um prazer ter você conosco durante essa jornada. Lembre-se que as portas estarão sempre abertas caso decida voltar a estudar conosco no futuro.",
      body3: "Desejamos muito sucesso em seus próximos passos!",
      footer: "Abraços,\nEquipe Fluency Lab",
    },
    en: {
      subject: "We'll miss you! 👋",
      heading: "We'll miss you! 👋",
      body1: "We confirm the cancellation of your Fluency Lab account as requested.",
      body2: "It was a pleasure having you with us during this journey. Remember that our doors will always be open should you decide to return to study with us in the future.",
      body3: "We wish you great success in your next steps!",
      footer: "Best regards,\nFluency Lab Team",
    }
  }
};
