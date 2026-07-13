import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import { validationMessage } from "./validationMessages";

function createBaseSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return z.object({
    name: z.string().trim().min(1, message("validation.requiredName")).max(120, message("validation.nameMax120")),
    email: z
      .string()
      .trim()
      .min(1, message("validation.requiredEmail"))
      .email(message("validation.invalidEmail"))
      .max(160, message("validation.emailMax160")),
    role: z.enum(["ADMIN", "USER"], {
      errorMap: () => ({ message: message("validation.requiredRole") }),
    }),
    allowanceEnabled: z.boolean(),
  });
}

export function createFamilyMemberSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return createBaseSchema(t).extend({
    password: z.string().min(8, message("validation.passwordMin8")).max(72, message("validation.passwordMax72")),
  });
}

export function createUpdateFamilyMemberSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return createBaseSchema(t).extend({
    password: z
      .string()
      .max(72, message("validation.passwordMax72"))
      .refine((value) => value.length === 0 || value.length >= 8, message("validation.passwordMin8")),
  });
}

export type CreateFamilyMemberFormValues = z.infer<ReturnType<typeof createFamilyMemberSchema>>;
export type UpdateFamilyMemberFormValues = z.infer<ReturnType<typeof createUpdateFamilyMemberSchema>>;
