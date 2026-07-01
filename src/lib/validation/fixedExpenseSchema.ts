import { z } from "zod";

export const fixedExpenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  amount: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().positive("O valor deve ser maior que zero."),
  ),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  accountId: z.string().min(1, "A conta é obrigatória."),
  dueDay: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .int("O dia de vencimento deve ser um número inteiro.")
      .min(1, "O dia de vencimento deve estar entre 1 e 31.")
      .max(31, "O dia de vencimento deve estar entre 1 e 31."),
  ),
});

export type FixedExpenseFormValues = z.infer<typeof fixedExpenseSchema>;
