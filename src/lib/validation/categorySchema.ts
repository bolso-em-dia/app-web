import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import { validationMessage } from "./validationMessages";

export function createCategorySchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) =>
    validationMessage(t, key);

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, message("validation.requiredName"))
      .max(120, message("validation.nameMax120")),
    icon: z.string().trim().max(80, message("validation.iconMax80")),
    color: z.string().trim().max(20, message("validation.colorMax20")),
  });
}

export function createArchiveCategorySchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) =>
    validationMessage(t, key);

  return z.object({
    replacementCategoryId: z
      .string()
      .min(1, message("validation.requiredReplacementCategory")),
  });
}

export type CategoryFormValues = z.infer<
  ReturnType<typeof createCategorySchema>
>;
export type ArchiveCategoryFormValues = z.infer<
  ReturnType<typeof createArchiveCategorySchema>
>;
