import { z } from "zod";

export const createWhatsAppTemplateSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/, "O nome deve conter apenas letras minúsculas, números e sublinhados"),
  category: z.enum(["AUTHENTICATION", "MARKETING", "UTILITY"]),
  language: z.string().default("pt_BR"),
  components: z.array(z.any()), 
  bodyText: z.string().min(1, "O conteúdo é obrigatório").optional(),
});

export type CreateWhatsAppTemplateValues = z.input<typeof createWhatsAppTemplateSchema>;
