import { vi, describe, it, expect, beforeEach } from "vitest";
import { contractService } from "../contract.service";
import { contractRepository } from "../contract.repository";
import { userService } from "../../user/user.service";
import { User } from "../../user/user.schema";
import { ContractTemplate, ContractInstance, SchoolSettings } from "../contract.schema";
import { communicationService } from "../../communication/communication.service";
import { billingService } from "../../billing/billing.service";

// Mocks de dependências externas
vi.mock("../contract.repository");
vi.mock("../../user/user.service");
vi.mock("../../communication/communication.service");
vi.mock("../../billing/billing.service");
vi.mock("../../notification/notification.service");
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));
vi.mock("@/lib/firebase-admin", () => ({
  adminStorage: {
    bucket: () => ({
      file: () => ({
        save: vi.fn().mockResolvedValue(true),
      }),
    }),
  },
}));
vi.mock("pdf-lib", () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      addPage: vi.fn().mockReturnValue({
        getSize: () => ({ width: 600, height: 800 }),
        drawText: vi.fn(),
        drawRectangle: vi.fn(),
      }),
      embedFont: vi.fn().mockResolvedValue({}),
      save: vi.fn().mockResolvedValue(new Uint8Array()),
    }),
  },
  StandardFonts: { Helvetica: "Helvetica", HelveticaBold: "HelveticaBold" },
}));
vi.mock("@/lib/cryptography", () => ({
  encrypt: vi.fn((val) => `enc_${val}`),
  generateIntegrityHash: vi.fn(() => "mock_hash"),
}));

describe("ContractService - Suite de Testes", () => {
  const mockUser = { id: "user_1", name: "João Silva", email: "joao@example.com", taxId: "123.456.789-00" };
  const mockSchool = { name: "Fluency Lab", taxId: "12.345.678/0001-99", legalName: "FL LTDA" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getUser).mockResolvedValue(mockUser as unknown as User);
    vi.mocked(contractRepository.getSchoolSettings).mockResolvedValue(mockSchool as unknown as SchoolSettings);
  });

  it("deve criar um template com tracking de versão automático", async () => {
    vi.mocked(contractRepository.findLastTemplateVersion).mockResolvedValue({ version: "1" } as unknown as ContractTemplate);
    vi.mocked(contractRepository.insertTemplate).mockImplementation(async (data) => data as unknown as ContractTemplate);

    const template = await contractService.createTemplate({
      name: "Contrato de Aluno",
      content: "# Termos",
      region: "BR",
      type: "student",
    });

    expect(template.version).toBe("2");
    expect(contractRepository.insertTemplate).toHaveBeenCalled();
  });

  it("deve permitir a assinatura de um contrato e enviar e-mail com PDF", async () => {
    const mockInstance = {
      id: "inst_1",
      userId: "user_1",
      status: "pending",
      template: { name: "Contrato Aluno", content: "Ola {{user.name}}" },
    };

    vi.mocked(contractRepository.findInstanceById).mockResolvedValue(mockInstance as unknown as ContractInstance);
    vi.mocked(contractRepository.updateInstance).mockResolvedValue({} as unknown as ContractInstance);

    const result = await contractService.signContract("user_1", "inst_1");

    expect(result.success).toBe(true);
    expect(contractRepository.updateInstance).toHaveBeenCalledWith("inst_1", expect.objectContaining({ 
        status: "signed",
        integrityHash: "mock_hash" 
    }));
    expect(communicationService.sendContractSignedEmail).toHaveBeenCalledWith(
      mockUser.email, 
      mockUser.name, 
      mockInstance.template.name, 
      expect.any(Uint8Array)
    );
  });

  it("deve lançar erro ao tentar assinar um contrato de outro usuário", async () => {
    vi.mocked(contractRepository.findInstanceById).mockResolvedValue({
      id: "inst_1",
      userId: "outro_user",
      status: "pending",
    } as unknown as ContractInstance);

    await expect(contractService.signContract("user_1", "inst_1"))
      .rejects.toThrow("Você não tem permissão");
  });

  it("deve solicitar cancelamento e cobrar taxa se não for o último mês", async () => {
    const mockInstance = { id: "inst_1", subscriptionId: "sub_1", status: "signed" };
    vi.mocked(contractRepository.findInstanceById).mockResolvedValue(mockInstance as unknown as ContractInstance);
    vi.mocked(billingService.cancelSubscription).mockResolvedValue({ success: true, pixCode: "pix123", pixImage: "mock_image" } as unknown as { success: true; pixCode: string; pixImage: string });

    const result = await contractService.requestCancellation("inst_1");

    expect(result.feeRequired).toBe(true);
    expect(result.pixCode).toBe("pix123");
    expect(contractRepository.updateInstance).not.toHaveBeenCalled();
  });

  it("deve cancelar automaticamente se for o último mês (sem taxa)", async () => {
    const mockInstance = { id: "inst_1", subscriptionId: "sub_1", status: "signed", template: { name: "T1" }, user: mockUser };
    vi.mocked(contractRepository.findInstanceById).mockResolvedValue(mockInstance as unknown as ContractInstance);
    vi.mocked(billingService.cancelSubscription).mockResolvedValue({ success: true } as unknown as { success: true });

    const result = await contractService.requestCancellation("inst_1");

    expect(result.feeRequired).toBe(false);
    expect(contractRepository.updateInstance).toHaveBeenCalledWith("inst_1", { status: "cancelled" });
    expect(communicationService.sendContractCancelledEmail).toHaveBeenCalled();
  });

  it("deve realizar auto-renovação reaproveitando a assinatura anterior", async () => {
    const oldInstance = {
      id: "old_1",
      userId: "user_1",
      user: mockUser,
      template: { type: "student", region: "BR", name: "T1" },
      signedContent: "Snapshot legal",
      integrityHash: "hash_original",
      autoRenew: true,
    };

    vi.mocked(contractRepository.findInstanceById).mockResolvedValue(oldInstance as unknown as ContractInstance);
    vi.mocked(contractRepository.findActiveTemplateByType).mockResolvedValue({ id: "tmpl_new", name: "T1 v2" } as unknown as ContractTemplate);
    vi.mocked(contractRepository.insertInstance).mockImplementation(async (data) => ({ ...data, id: "new_1" } as unknown as ContractInstance));

    await contractService.renewContract("old_1", true);

    expect(contractRepository.insertInstance).toHaveBeenCalledWith(expect.objectContaining({
      status: "signed",
      parentInstanceId: "old_1",
      integrityHash: "hash_original", // Reaproveitado
    }));
    expect(communicationService.sendContractRenewedEmail).toHaveBeenCalled();
  });
});
