import { z } from "zod";
import type { Translate } from "../../app/i18n/I18nContext";
import type {
  OwnershipType,
  TransactionType,
} from "../../app/api/transactions";
import { validationMessage } from "./validationMessages";

const TRANSACTION_TYPE_VALUES = [
  "INCOME",
  "EXPENSE",
] as const satisfies readonly TransactionType[];
const OWNERSHIP_TYPE_VALUES = [
  "SHARED",
  "INDIVIDUAL",
] as const satisfies readonly OwnershipType[];

export function createTransactionSchema(t: Translate) {
  const message = (key: Parameters<typeof validationMessage>[1]) =>
    validationMessage(t, key);

  return z
    .object({
      type: z.enum(TRANSACTION_TYPE_VALUES, {
        errorMap: () => ({ message: message("validation.requiredType") }),
      }),
      ownershipType: z.enum(OWNERSHIP_TYPE_VALUES, {
        errorMap: () => ({ message: message("validation.requiredOwnership") }),
      }),
      description: z
        .string()
        .trim()
        .min(1, message("validation.requiredDescription"))
        .max(160, message("validation.descriptionMax160")),
      amount: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce
          .number({ invalid_type_error: message("validation.invalidNumber") })
          .positive(message("validation.amountPositive")),
      ),
      transactionDate: z
        .string()
        .min(1, message("validation.requiredTransactionDate")),
      accountId: z.string().min(1, message("validation.requiredAccount")),
      categoryId: z.string().min(1, message("validation.requiredCategory")),
      memberId: z.string(),
      isInstallment: z.boolean(),
      installmentCount: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce
          .number({ invalid_type_error: message("validation.invalidNumber") })
          .int(message("validation.installmentCountInteger"))
          .min(2, message("validation.installmentCountRange"))
          .max(120, message("validation.installmentCountRange"))
          .optional(),
      ),
    })
    .superRefine((values, context) => {
      if (
        values.ownershipType === "INDIVIDUAL" &&
        values.memberId.trim().length === 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["memberId"],
          message: message("validation.requiredIndividualMember"),
        });
      }

      if (
        values.type === "EXPENSE" &&
        values.isInstallment &&
        values.installmentCount === undefined
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installmentCount"],
          message: message("validation.requiredInstallmentCount"),
        });
      }
    });
}

export type TransactionFormValues = z.infer<
  ReturnType<typeof createTransactionSchema>
>;
