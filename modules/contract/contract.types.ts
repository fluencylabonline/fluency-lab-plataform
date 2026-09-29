import { ContractInstance, ContractTemplate } from "./contract.schema";

export type ContractWithTemplate = ContractInstance & {
  template?: ContractTemplate | null;
  // These fields are often added for UI convenience in services
  title?: string;
  version?: string;
  type?: string;
};

/**
 * Subconjunto público das configurações da escola usado nos placeholders
 * `{{school.*}}` do contrato. Não inclui o CPF do representante nem o
 * endereço — nada disso é necessário para renderizar o documento no cliente.
 */
export interface ContractSchoolInfo {
  name: string;
  legalName: string;
  taxId: string;
  representativeName: string;
}
