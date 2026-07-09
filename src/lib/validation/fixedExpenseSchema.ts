import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import { validationMessage } from "./validationMessages";

export function createFixedExpenseSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) =>
    validationMessage(t, key);

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, message("validation.requiredName"))
      .max(120, message("validation.nameMax120")),
    type: z.enum(["INCOME", "EXPENSE"], {
      required_error: message("validation.requiredType"),
    }),
    amount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ invalid_type_error: message("validation.invalidNumber") })
        .positive(message("validation.amountPositive")),
    ),
    categoryId: z.string().min(1, message("validation.requiredCategory")),
    accountId: z.string().min(1, message("validation.requiredAccount")),
    dueDay: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ invalid_type_error: message("validation.invalidNumber") })
        .int(message("validation.dayInteger"))
        .min(1, message("validation.dayRange"))
        .max(31, message("validation.dayRange")),
    ),
  });
}

export type FixedExpenseFormValues = z.infer<
  ReturnType<typeof createFixedExpenseSchema>
>;
