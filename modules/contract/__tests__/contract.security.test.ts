import { describe, it, expect, vi, beforeEach } from "vitest";
import { contractService } from "../contract.service";
import { contractRepository } from "../contract.repository";
import { userService } from "../../user/user.service";
import { User } from "../../user/user.schema";
import { ContractTemplate, ContractInstance, SchoolSettings } from "../contract.schema";

// Mocks
vi.mock("@/env", () => ({
  env: {
    ENCRYPTION_KEY: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    RESEND_API_KEY: "re_mock_123",
    ABACATEPAY_API_KEY: "abc_mock_123"
  }
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {},
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  }
}));

vi.mock("../contract.repository");
vi.mock("../../user/user.service");
vi.mock("../../communication/communication.service");
vi.mock("@/lib/firebase-admin", () => ({
  adminStorage: {
    bucket: () => ({
      file: () => ({
        save: vi.fn().mockResolvedValue(true)
      })
    })
  }
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

describe("Contract Service - Security & Forensic Audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractRepository.findInstanceById).mockResolvedValue({
      id: "inst_123",
      userId: "user_123",
      template: { name: "Test Template", region: "BR", content: "Contract for {{student_name}}" },
      user: { name: "John Doe", email: "john@example.com" },
      signaturesMetadata: []
    } as unknown as ContractInstance);
    vi.mocked(contractRepository.findLastTemplateVersion).mockResolvedValue({ version: "1" } as unknown as ContractTemplate);
    vi.mocked(contractRepository.deactivateTemplatesByName).mockResolvedValue({} as unknown as Record<string, unknown>);
    vi.mocked(contractRepository.insertTemplate).mockResolvedValue({} as unknown as ContractTemplate);
    vi.mocked(contractRepository.saveSignatureMetadata).mockResolvedValue({} as unknown as Record<string, unknown>);
    vi.mocked(contractRepository.findInstanceByIntegrityHash).mockResolvedValue({
      template: { name: "Agreement", region: "US" },
      user: { name: "Alice" },
      signedAt: new Date(),
      signaturesMetadata: [{ createdAt: new Date(), ipAddress: "1.1.1.1" }],
    } as unknown as ContractInstance);
    vi.mocked(contractRepository.getSchoolSettings).mockResolvedValue({
      name: "Fluency Lab",
      taxId: "12.345.678/0001-99",
      legalName: "FL LTDA"
    } as unknown as SchoolSettings);
    
    vi.mocked(userService.getUser).mockResolvedValue({
      id: "user_123",
      name: "John Doe",
      email: "john@example.com"
    } as unknown as User);
  });

  it("should deactivate old versions when creating a new template", async () => {
    vi.mocked(contractRepository.findLastTemplateVersion).mockResolvedValue({
      version: "1",
    } as unknown as ContractTemplate);

    await contractService.createTemplate({
      name: "Standard Class",
      content: "Content V2",
      region: "BR",
      type: "student"
    });

    expect(contractRepository.deactivateTemplatesByName).toHaveBeenCalledWith("Standard Class", "BR");
    expect(contractRepository.insertTemplate).toHaveBeenCalledWith(expect.objectContaining({
      version: "2",
      isActive: true
    }));
  });

  it("should save forensic metadata (IP/UA) during signature", async () => {
    const mockInstance = {
      id: "inst_123",
      userId: "user_123",
      status: "pending",
      template: { name: "Test", region: "BR", content: "Contract body" },
      user: { name: "John Doe", email: "john@example.com" },
      signaturesMetadata: [],
    };

    vi.mocked(contractRepository.findInstanceById).mockResolvedValue(mockInstance as unknown as ContractInstance);
    
    await contractService.signContract("user_123", "inst_123", undefined, {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0"
    });

    expect(contractRepository.saveSignatureMetadata).toHaveBeenCalledWith({
      instanceId: "inst_123",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0"
    });
  });

  it("should verify a valid contract by hash", async () => {
    const mockInstance = {
      template: { name: "Agreement", region: "US", content: "Signed contract" },
      user: { name: "Alice" },
      signedAt: new Date(),
      signaturesMetadata: [{ createdAt: new Date(), ipAddress: "1.1.1.1" }],
    };

    vi.mocked(contractRepository.findInstanceByIntegrityHash).mockResolvedValue(mockInstance as unknown as ContractInstance);

    const result = await contractService.verifyContract("hash_valid");

    expect(result.isValid).toBe(true);
    expect(result.contractName).toBe("Agreement");
    expect(result.signedBy).toBe("Alice");
  });
});
