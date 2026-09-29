import type { User } from "@/modules/user/user.schema";

/**
 * Dados do responsável legal, em texto puro (nunca a versão criptografada do banco).
 */
export interface OnboardingGuardianData {
  name?: string;
  taxId?: string;
  relationship?: string;
  cellphone?: string;
}

/**
 * Perfil usado para preencher os formulários do onboarding.
 *
 * Diferente de `User`: os campos de PII vêm descriptografados e o endereço vem
 * achatado em campos individuais, no formato que os inputs esperam. Nunca
 * entregue um `User` cru aos steps — `taxId`, `cellphone` e `address` estão
 * criptografados no banco e apareceriam como ciphertext nos campos.
 */
export interface OnboardingProfile extends Partial<User> {
  zipCode?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  guardianData?: OnboardingGuardianData;
}
