import { settingsRepository } from "./settings.repository";
import { UpdateSystemSettingsValues } from "./settings.schema";

export const settingsService = {
  async getSettings() {
    let settings = await settingsRepository.getSettings();
    if (!settings) {
      settings = await settingsRepository.createDefaultSettings();
    }
    return settings;
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
};
