import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must have at most 120 characters."),
  icon: z.string().trim().max(80, "Icon must have at most 80 characters."),
  color: z.string().trim().max(20, "Color must have at most 20 characters."),
});

export const archiveCategorySchema = z.object({
  archivedFromMonth: z.string().min(1, "Archive month is required."),
  replacementCategoryId: z.string().min(1, "Replacement category is required."),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ArchiveCategoryFormValues = z.infer<typeof archiveCategorySchema>;
