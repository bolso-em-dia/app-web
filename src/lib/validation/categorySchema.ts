import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  icon: z.string().trim().max(80, "O ícone deve ter no máximo 80 caracteres."),
  color: z.string().trim().max(20, "A cor deve ter no máximo 20 caracteres."),
});

export const archiveCategorySchema = z.object({
  archivedFromMonth: z.string().min(1, "O mês de arquivamento é obrigatório."),
  replacementCategoryId: z
    .string()
    .min(1, "A categoria substituta é obrigatória."),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ArchiveCategoryFormValues = z.infer<typeof archiveCategorySchema>;
