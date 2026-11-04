import "server-only";
import { getTranslations } from "next-intl/server";
import { MissingFiscalDataError, PixProviderRejectedError } from "@/lib/payment-errors";

/**
 * Converte erros de cobrança em mensagem para o usuário. O erro bruto do provedor
 * (inglês/JSON) fica só no log; regras de negócio já escritas para o usuário passam.
 */
export async function toUserFacingBillingError(error: unknown): Promise<string> {
  const t = await getTranslations("Billing.errors");
  if (error instanceof MissingFiscalDataError) return t("missingFiscalData");
  if (error instanceof PixProviderRejectedError) return t("pixGeneration");
  if (error instanceof Error && error.message) return error.message;
  return t("pixGeneration");
}
