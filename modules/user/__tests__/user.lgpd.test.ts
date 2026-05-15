import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../user.service';
import { userRepository } from '../user.repository';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';
import { abacate } from '@/lib/abacate-pay';
import { communicationService } from '@/modules/communication/communication.service';
import { createMockUser } from './test-utils';
import { encrypt } from '@/lib/cryptography';

// Mock dependencies
vi.mock('../user.repository');
vi.mock('@/modules/communication/communication.service');

describe('UserService LGPD Compliance', () => {
  const mockUserId = 'user-123';
  const mockAbacateId = 'cust_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportData', () => {
    it('should decrypt sensitive data and omit mfaSecret', async () => {
      const encryptedTaxId = encrypt('123.456.789-00');
      const mockUser = createMockUser({
        id: mockUserId,
        taxId: encryptedTaxId,
        mfaSecret: encrypt('secret123'),
      });

      vi.mocked(userRepository.getComprehensiveUserData).mockResolvedValue(mockUser);

      const result = await userService.exportData(mockUserId);

      expect(result.taxId).toBe('123.456.789-00');
      expect(result.mfaSecret).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.getComprehensiveUserData).mockResolvedValue(undefined);
      await expect(userService.exportData('invalid')).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('purgeUserData', () => {
    it('should execute full deletion flow in correct order', async () => {
      const mockUser = createMockUser({
        id: mockUserId,
        abacatePayCustomerId: mockAbacateId,
        email: 'test@test.com',
        name: 'Test User'
      });

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);
      
      const mockFile = { delete: vi.fn().mockResolvedValue({}) };
      const bucket = adminStorage.bucket();
      // @ts-expect-error - Mocking complex bucket types
      vi.mocked(bucket.getFiles).mockResolvedValue([[mockFile as unknown], {}]);

      await userService.purgeUserData(mockUserId);

      // 1. Communication
      expect(communicationService.sendFarewellEmail).toHaveBeenCalledWith(mockUser.email, mockUser.name);

      // 2. Repository Anonymization
      expect(userRepository.anonymize).toHaveBeenCalledWith(mockUserId);

      // 3. Firebase Auth
      expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith(mockUserId);
      expect(adminAuth.deleteUser).toHaveBeenCalledWith(mockUserId);

      // 4. Firebase Storage Cleanup
      expect(bucket.getFiles).toHaveBeenCalledWith({ prefix: `documents/${mockUserId}/` });
      expect(bucket.getFiles).toHaveBeenCalledWith({ prefix: `certificates/${mockUserId}/` });
      expect(bucket.getFiles).toHaveBeenCalledWith({ prefix: `avatars/${mockUserId}` });
      expect(mockFile.delete).toHaveBeenCalled();

      // 5. AbacatePay Deletion
      expect(abacate.customers.delete).toHaveBeenCalledWith(mockAbacateId);
    });

    it('should not call AbacatePay if no customer ID exists', async () => {
      const mockUser = createMockUser({
        id: mockUserId,
        abacatePayCustomerId: null
      });

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      await userService.purgeUserData(mockUserId);

      expect(abacate.customers.delete).not.toHaveBeenCalled();
    });

    it('should continue even if email fails', async () => {
      const mockUser = createMockUser({ id: mockUserId });
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(communicationService.sendFarewellEmail).mockRejectedValue(new Error('SMTP Error'));

      // Should not throw
      await userService.purgeUserData(mockUserId);

      expect(userRepository.anonymize).toHaveBeenCalled();
    });

    it('should continue even if storage cleanup fails', async () => {
      const mockUser = createMockUser({ id: mockUserId });
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);
      
      const bucket = adminStorage.bucket();
      vi.mocked(bucket.getFiles).mockRejectedValue(new Error('Firebase Storage Error'));

      // Should not throw
      await userService.purgeUserData(mockUserId);

      expect(userRepository.anonymize).toHaveBeenCalled();
    });
  });
});
