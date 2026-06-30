import { z } from "zod";

export const fixedExpenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must have at most 120 characters."),
  amount: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().positive("Amount must be greater than zero."),
  ),
  categoryId: z.string().min(1, "Category is required."),
  accountId: z.string().min(1, "Account is required."),
  dueDay: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .int("Due day must be a whole number.")
      .min(1, "Due day must be between 1 and 31.")
      .max(31, "Due day must be between 1 and 31."),
  ),
});

export const archiveFixedExpenseSchema = z.object({
  archivedFromMonth: z.string().min(1, "Archive month is required."),
});

export type FixedExpenseFormValues = z.infer<typeof fixedExpenseSchema>;
export type ArchiveFixedExpenseFormValues = z.infer<
  typeof archiveFixedExpenseSchema
>;
