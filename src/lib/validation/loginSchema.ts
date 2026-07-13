import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import { validationMessage } from "./validationMessages";

export function createLoginSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return z.object({
    email: z.string().trim().min(1, message("validation.requiredEmail")).email(message("validation.invalidEmail")),
    password: z.string().min(1, message("validation.requiredPassword")).min(8, message("validation.passwordMin8")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
