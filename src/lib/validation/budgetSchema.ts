import { z } from "zod";
import type { BudgetType } from "../../app/api/budgets";

const ENVELOPE_TYPE_VALUES = [
  "GLOBAL",
  "ALLOWANCE",
] as const satisfies readonly BudgetType[];

export const budgetSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    type: z.enum(ENVELOPE_TYPE_VALUES, {
      errorMap: () => ({ message: "O tipo é obrigatório." }),
    }),
    ownerMemberId: z.string(),
    categoryIds: z.array(z.string()),
    monthlyLimit: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().positive("O limite mensal deve ser maior que zero."),
    ),
  })
  .superRefine((values, context) => {
    if (
      values.type === "ALLOWANCE" &&
      values.ownerMemberId.trim().length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ownerMemberId"],
        message: "O membro dono é obrigatório para budgets de mesada.",
      });
    }

    if (values.type === "GLOBAL" && values.categoryIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryIds"],
        message: "Selecione pelo menos uma categoria para budgets globais.",
      });
    }
  });

export type BudgetFormValues = z.infer<typeof budgetSchema>;
