import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import type { AccountType } from "../../app/api/accounts";
import { validationMessage } from "./validationMessages";

const ACCOUNT_TYPE_VALUES = ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT"] as const satisfies readonly AccountType[];

export function createAccountSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return z
    .object({
      name: z.string().trim().min(1, message("validation.requiredName")).max(120, message("validation.nameMax120")),
      type: z.enum(ACCOUNT_TYPE_VALUES, {
        errorMap: () => ({ message: message("validation.requiredType") }),
      }),
      currency: z.enum(["BRL", "USD"]).optional().default("BRL"),
      brand: z.string().trim().max(80, message("validation.brandMax80")),
      color: z.string().trim().max(20, message("validation.colorMax20")),
      closingDay: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce
          .number({ invalid_type_error: message("validation.invalidNumber") })
          .int(message("validation.dueDayInteger"))
          .min(1, message("validation.dueDayRange"))
          .max(31, message("validation.dueDayRange"))
          .optional(),
      ),
      dueDay: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce
          .number({ invalid_type_error: message("validation.invalidNumber") })
          .int(message("validation.dueDayInteger"))
          .min(1, message("validation.dueDayRange"))
          .max(31, message("validation.dueDayRange"))
          .optional(),
      ),
    })
    .superRefine((values, context) => {
      if (values.type === "CREDIT_CARD") {
        if (values.brand.trim().length === 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["brand"],
            message: message("validation.requiredCreditCardBrand"),
          });
        }

        if (values.closingDay === undefined || Number.isNaN(values.closingDay)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["closingDay"],
            message: message("validation.requiredCreditCardClosingDay"),
          });
        }

        if (values.dueDay === undefined || Number.isNaN(values.dueDay)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dueDay"],
            message: message("validation.requiredCreditCardDueDay"),
          });
        }
      }
    });
}

export type AccountFormValues = z.infer<ReturnType<typeof createAccountSchema>>;
