import { ContractInstance, ContractTemplate } from "./contract.schema";

/**
 * Linha da listagem de contratos do admin. Fica de fora o que não aparece na
 * tabela e não deve ir para o navegador: `signedContent` (contrato com CPF e
 * endereço injetados), `guardianData` e o cadastro completo do usuário.
 */
export type ContractInstanceListItem = Pick<
  ContractInstance,
  "id" | "templateId" | "userId" | "status" | "integrityHash" | "signedAt" | "expiresAt" | "pdfUrl" | "createdAt"
> & {
  template: Pick<ContractTemplate, "id" | "name" | "version" | "region">;
  user: { id: string; name: string; email: string };
};

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
