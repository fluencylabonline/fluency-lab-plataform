import { z } from "zod";
import { insertProcedureSchema, updateProcedureSchema } from "./procedure.schema";
import type { JSONContent } from "@tiptap/core";

export type InsertProcedureInput = z.input<typeof insertProcedureSchema>;
export type UpdateProcedureInput = z.input<typeof updateProcedureSchema>;

export interface Procedure {
  id: string;
  title: string;
  content: JSONContent;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    photoUrl: string | null;
  } | null;
}
