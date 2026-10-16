import "server-only";
import { settingsRepository } from "./settings.repository";
import { UpdateSystemSettingsValues, UpdateDelinquencyPolicyValues } from "./settings.schema";

export const settingsService = {
  async getSettings() {
    return settingsRepository.getOrCreateSettings();
  },

  async updateSettings(
    userId: string,
    userRole: string,
    data: UpdateSystemSettingsValues
  ) {
    if (userRole !== "admin") {
      throw new Error("Sem permissão para alterar as configurações do sistema");
    }

    return settingsRepository.updateSettings(data);
  },

  /**
   * Política de inadimplência vigente. `start` é null quando está desligada:
   * nesse caso ninguém é bloqueado nem cancelado, só os lembretes rodam.
   */
  async getDelinquencyPolicy(): Promise<{ start: Date | null; autoCancelEnabled: boolean }> {
    const settings = await this.getSettings();
    const start =
      settings.delinquencyPolicyEnabled && settings.delinquencyPolicyStart
        ? new Date(`${settings.delinquencyPolicyStart}T00:00:00Z`)
        : null;
    return { start, autoCancelEnabled: !!start && settings.delinquencyAutoCancelEnabled };
  },

  async updateDelinquencyPolicy(userRole: string, data: UpdateDelinquencyPolicyValues) {
    if (userRole !== "admin") {
      throw new Error("Sem permissão para alterar as configurações do sistema");
    }
    return settingsRepository.updateSettings({
      delinquencyPolicyEnabled: data.enabled,
      delinquencyPolicyStart: data.startDate,
      delinquencyAutoCancelEnabled: data.enabled && data.autoCancelEnabled,
    });
  },
};
