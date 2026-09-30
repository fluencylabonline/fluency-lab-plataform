import type { RoleHelpContent, SharedHelpRoute } from "../page-help.types";

/**
 * Ajuda das rotas de `/hub` que não pertencem a um papel — português.
 */
export const SHARED_HELP_PT: RoleHelpContent<SharedHelpRoute> = {
  "/hub/financial/receipt/[id]": {
    title: "Recibo",
    summary: "O comprovante de uma mensalidade já paga, para baixar ou guardar.",
    sections: [
      {
        heading: "O que o recibo mostra",
        body: "Os dados do pagamento: valor, data, referência da parcela e a identificação da escola. É gerado automaticamente a partir do pagamento confirmado, não é preenchido à mão.",
      },
      {
        heading: "Baixar",
        body: "O botão verde gera o PDF do recibo e baixa no seu aparelho. A geração leva alguns segundos e o botão avisa enquanto está trabalhando.",
      },
      {
        heading: "Quem pode abrir",
        body: "O aluno dono do pagamento e a administração. Ninguém mais alcança esta página, mesmo com o link.",
      },
      {
        heading: "Voltar",
        body: "A seta do topo leva de volta à lista de pagamentos, onde ficam todas as parcelas do plano.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "O comprovante",
        text: "Este é o recibo de uma mensalidade já paga, gerado automaticamente a partir do pagamento confirmado.",
      },
      {
        id: "download",
        target: "receipt.download",
        title: "Baixar",
        text: "Gera o PDF e baixa no seu aparelho. Leva alguns segundos — o botão avisa enquanto está gerando.",
      },
      {
        id: "back",
        title: "Voltar aos pagamentos",
        text: "A seta do topo leva de volta à lista, onde ficam todas as parcelas do plano.",
      },
    ],
  },
};
