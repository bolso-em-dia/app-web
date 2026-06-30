import { z } from "zod";
import type {
  OwnershipType,
  TransactionType,
} from "../../app/api/transactions";

const TRANSACTION_TYPE_VALUES = [
  "INCOME",
  "EXPENSE",
] as const satisfies readonly TransactionType[];
const OWNERSHIP_TYPE_VALUES = [
  "SHARED",
  "INDIVIDUAL",
] as const satisfies readonly OwnershipType[];

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPE_VALUES, {
      errorMap: () => ({ message: "Type is required." }),
    }),
    ownershipType: z.enum(OWNERSHIP_TYPE_VALUES, {
      errorMap: () => ({ message: "Ownership type is required." }),
    }),
    description: z
      .string()
      .trim()
      .min(1, "Description is required.")
      .max(160, "Description must have at most 160 characters."),
    amount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().positive("Amount must be greater than zero."),
    ),
    transactionDate: z.string().min(1, "Transaction date is required."),
    referenceMonth: z.string().min(1, "Reference month is required."),
    accountId: z.string().min(1, "Account is required."),
    categoryId: z.string().min(1, "Category is required."),
    memberId: z.string(),
    installmentCount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number()
        .int("Installment count must be a whole number.")
        .min(1, "Installment count must be between 1 and 120.")
        .max(120, "Installment count must be between 1 and 120.")
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
        message: "Member is required for individual transactions.",
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
