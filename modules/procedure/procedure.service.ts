import { procedureRepository } from "./procedure.repository";
import type { JSONContent } from "@tiptap/core";
import { UserRoles } from "@/lib/rbac";
import { usersTable } from "../user/user.schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export const procedureService = {
  async getAllProcedures() {
    // Apenas verificar se o usuário existe, se for preciso 
    // RBAC: Normalmente controlado nas Server Actions e layout
    return procedureRepository.findAll();
  },

  async getProcedureById(id: string) {
    const procedure = await procedureRepository.findById(id);
    if (!procedure) throw new Error("Procedimento não encontrado");
    return procedure;
  },

  async createProcedure(userId: string, title: string) {
    // Verifica se o criador é admin (RBAC adicional de segurança)
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });
    if (user?.role !== UserRoles.ADMIN) {
      throw new Error("Sem permissão para criar procedimentos");
    }

    return procedureRepository.create({
      title,
      createdBy: userId,
    });
  },

  async updateProcedure(id: string, data: { title?: string; content?: JSONContent }) {
    const procedure = await procedureRepository.findById(id);
    if (!procedure) throw new Error("Procedimento não encontrado");
    
    return procedureRepository.update(id, data);
  },

  async deleteProcedure(id: string) {
    const procedure = await procedureRepository.findById(id);
    if (!procedure) throw new Error("Procedimento não encontrado");

    await procedureRepository.delete(id);
  }
};
