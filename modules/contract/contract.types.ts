import { ContractInstance, ContractTemplate } from "./contract.schema";

export type ContractWithTemplate = ContractInstance & {
  template?: ContractTemplate | null;
  // These fields are often added for UI convenience in services
  title?: string;
  version?: string;
  type?: string;
};
