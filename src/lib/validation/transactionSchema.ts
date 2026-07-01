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
      errorMap: () => ({ message: "O tipo é obrigatório." }),
    }),
    ownershipType: z.enum(OWNERSHIP_TYPE_VALUES, {
      errorMap: () => ({ message: "A titularidade é obrigatória." }),
    }),
    description: z
      .string()
      .trim()
      .min(1, "A descrição é obrigatória.")
      .max(160, "A descrição deve ter no máximo 160 caracteres."),
    amount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().positive("O valor deve ser maior que zero."),
    ),
    transactionDate: z.string().min(1, "A data da transação é obrigatória."),
    accountId: z.string().min(1, "A conta é obrigatória."),
    categoryId: z.string().min(1, "A categoria é obrigatória."),
    memberId: z.string(),
    isInstallment: z.boolean(),
    installmentCount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number()
        .int("A quantidade de parcelas deve ser um número inteiro.")
        .min(2, "A quantidade de parcelas deve estar entre 2 e 120.")
        .max(120, "A quantidade de parcelas deve estar entre 2 e 120.")
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
        message: "O membro é obrigatório para transações individuais.",
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
        message: "A quantidade de parcelas é obrigatória.",
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
