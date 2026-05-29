import { audioRepository } from "./audio.repository";
import { checkRateLimit } from "@/lib/rate-limit";
import type { NewAudio } from "./audio.schema";

export const audioService = {
  async listAll(requesterRole: string) {
    // Apenas professores e admins acessam a galeria de áudios
    if (requesterRole !== "teacher" && requesterRole !== "admin") {
      throw new Error("Apenas professores podem acessar a biblioteca de áudios.");
    }
    return audioRepository.listAll();
  },

  async createAudio(
    userId: string,
    userRole: string,
    data: Omit<NewAudio, "uploadedBy">
  ) {
    // 1. RBAC: Apenas professores e administradores podem salvar áudios
    if (userRole !== "teacher" && userRole !== "admin") {
      throw new Error("Apenas professores podem fazer upload e salvar áudios.");
    }

    // 2. Rate Limiting: Máximo de 15 uploads de áudio por dia (24h)
    const DAILY_LIMIT = 15;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const limit = await checkRateLimit("audio_upload", userId, DAILY_LIMIT, ONE_DAY_MS);
    if (!limit.success) {
      throw new Error("Você atingiu o limite máximo de 15 uploads de áudio por dia.");
    }

    // 3. Criar registro no banco
    return audioRepository.create({
      ...data,
      uploadedBy: userId,
    });
  },

  async deleteAudio(userId: string, userRole: string, audioId: string) {
    if (userRole !== "admin" && userRole !== "teacher") {
      throw new Error("Não autorizado.");
    }

    const audio = await audioRepository.findById(audioId);
    if (!audio) throw new Error("Áudio não encontrado.");

    // Professores só podem deletar os áudios que eles mesmos enviaram
    if (userRole === "teacher" && audio.uploadedBy !== userId) {
      throw new Error("Você não tem permissão para deletar este áudio.");
    }

    await audioRepository.delete(audioId);
  }
};
