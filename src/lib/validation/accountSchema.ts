import { z } from "zod";
import type { AccountType } from "../../app/api/accounts";

const ACCOUNT_TYPE_VALUES = [
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
  "INVESTMENT",
] as const satisfies readonly AccountType[];

export const accountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    type: z.enum(ACCOUNT_TYPE_VALUES, {
      errorMap: () => ({ message: "O tipo é obrigatório." }),
    }),
    brand: z
      .string()
      .trim()
      .max(80, "A bandeira deve ter no máximo 80 caracteres."),
    color: z.string().trim().max(20, "A cor deve ter no máximo 20 caracteres."),
    closingDay: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().min(1).max(31).optional(),
    ),
    dueDay: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().min(1).max(31).optional(),
    ),
  })
  .superRefine((values, context) => {
    if (values.type === "CREDIT_CARD") {
      if (values.brand.trim().length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["brand"],
          message: "A bandeira é obrigatória para cartões de crédito.",
        });
      }

      if (values.closingDay === undefined || Number.isNaN(values.closingDay)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closingDay"],
          message: "O dia de fechamento é obrigatório para cartões de crédito.",
        });
      }

      if (values.dueDay === undefined || Number.isNaN(values.dueDay)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDay"],
          message: "O dia de vencimento é obrigatório para cartões de crédito.",
        });
      }
    }
  });

export const archiveAccountSchema = z.object({
  archivedFromMonth: z.string().min(1, "O mês de arquivamento é obrigatório."),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
export type ArchiveAccountFormValues = z.infer<typeof archiveAccountSchema>;
