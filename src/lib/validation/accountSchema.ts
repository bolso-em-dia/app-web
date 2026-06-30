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
      .min(1, "Name is required.")
      .max(120, "Name must have at most 120 characters."),
    type: z.enum(ACCOUNT_TYPE_VALUES, {
      errorMap: () => ({ message: "Type is required." }),
    }),
    brand: z.string().trim().max(80, "Brand must have at most 80 characters."),
    color: z.string().trim().max(20, "Color must have at most 20 characters."),
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
          message: "Brand is required for credit cards.",
        });
      }

      if (values.closingDay === undefined || Number.isNaN(values.closingDay)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["closingDay"],
          message: "Closing day is required for credit cards.",
        });
      }

      if (values.dueDay === undefined || Number.isNaN(values.dueDay)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDay"],
          message: "Due day is required for credit cards.",
        });
      }
    }
  });

export const archiveAccountSchema = z.object({
  archivedFromMonth: z.string().min(1, "Archive month is required."),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
export type ArchiveAccountFormValues = z.infer<typeof archiveAccountSchema>;
