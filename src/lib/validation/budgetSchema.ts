import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import type { BudgetType } from "../../app/api/budgets";
import { validationMessage } from "./validationMessages";

const BUDGET_TYPE_VALUES = ["GLOBAL", "ALLOWANCE"] as const satisfies readonly BudgetType[];

export function createBudgetSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) => validationMessage(t, key);

  return z
    .object({
      name: z.string().trim().min(1, message("validation.requiredName")).max(120, message("validation.nameMax120")),
      type: z.enum(BUDGET_TYPE_VALUES, {
        errorMap: () => ({ message: message("validation.requiredType") }),
      }),
      ownerMemberId: z.string(),
      categoryIds: z.array(z.string()),
      monthlyLimit: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce.number({ invalid_type_error: message("validation.invalidNumber") }).positive(message("validation.monthlyLimitPositive")),
      ),
    })
    .superRefine((values, context) => {
      if (values.type === "ALLOWANCE" && values.ownerMemberId.trim().length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ownerMemberId"],
          message: message("validation.requiredAllowanceOwner"),
        });
      }

      if (values.type === "GLOBAL" && values.categoryIds.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categoryIds"],
          message: message("validation.requiredGlobalBudgetCategory"),
        });
      }
    });
}

export type BudgetFormValues = z.infer<ReturnType<typeof createBudgetSchema>>;
