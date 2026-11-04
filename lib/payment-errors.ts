// Erros de pagamento sem dependências (podem ser importados em testes e na UI do servidor).

/**
 * O provedor respondeu e recusou explicitamente a operação (nada foi enviado).
 * Diferente de erro de rede/timeout, em que não se sabe se o PIX saiu.
 */
export class PixProviderRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PixProviderRejectedError";
  }
}

/** Aluno/responsável sem CPF ou telefone: não dá para emitir a cobrança. */
export class MissingFiscalDataError extends Error {
  constructor() {
    super("MISSING_STUDENT_FISCAL_DATA");
    this.name = "MissingFiscalDataError";
  }
}
