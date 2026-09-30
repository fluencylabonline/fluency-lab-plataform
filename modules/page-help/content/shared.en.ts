import type { RoleHelpContent, SharedHelpRoute } from "../page-help.types";

/**
 * Ajuda das rotas de `/hub` que não pertencem a um papel — inglês.
 */
export const SHARED_HELP_EN: RoleHelpContent<SharedHelpRoute> = {
  "/hub/financial/receipt/[id]": {
    title: "Receipt",
    summary: "The proof of payment for an invoice already settled, to download or keep.",
    sections: [
      {
        heading: "What the receipt shows",
        body: "The payment details: amount, date, instalment reference and the school's identification. It is generated automatically from the confirmed payment, not filled in by hand.",
      },
      {
        heading: "Download",
        body: "The green button generates the receipt PDF and downloads it to your device. Generating takes a few seconds and the button tells you while it is working.",
      },
      {
        heading: "Who can open it",
        body: "The student the payment belongs to, and the administration. Nobody else can reach this page, even with the link.",
      },
      {
        heading: "Going back",
        body: "The arrow at the top returns to the payments list, where all the plan's instalments live.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The proof of payment",
        text: "This is the receipt for an invoice already settled, generated automatically from the confirmed payment.",
      },
      {
        id: "download",
        target: "receipt.download",
        title: "Download",
        text: "Generates the PDF and downloads it to your device. It takes a few seconds — the button tells you while it is generating.",
      },
      {
        id: "back",
        title: "Back to payments",
        text: "The arrow at the top returns to the list, where all the plan's instalments live.",
      },
    ],
  },
};
