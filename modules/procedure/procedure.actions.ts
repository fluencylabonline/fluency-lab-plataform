"use server";

import { adminAction } from "@/lib/safe-action";
import { insertProcedureSchema, updateProcedureSchema } from "./procedure.schema";
import { procedureService } from "./procedure.service";
import { refresh } from "next/cache";
import { z } from "zod";

export const createProcedureAction = adminAction
  .metadata({ name: "createProcedure" })
  .schema(insertProcedureSchema)
  .action(async ({ parsedInput, ctx }) => {
    const procedure = await procedureService.createProcedure(
      ctx.user.id,
      parsedInput.title
    );
    
    refresh();
    
    return { procedureId: procedure.id };
  });

export const updateProcedureAction = adminAction
  .metadata({ name: "updateProcedure" })
  .schema(updateProcedureSchema)
  .action(async ({ parsedInput }) => {
    await procedureService.updateProcedure(parsedInput.procedureId, {
      title: parsedInput.title,
      content: parsedInput.content,
    });
    
    refresh();
    
    return { success: true };
  });

export const deleteProcedureAction = adminAction
  .metadata({ name: "deleteProcedure" })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await procedureService.deleteProcedure(parsedInput.id);
    
    refresh();
    
    return { success: true };
  });
