import { z } from "zod";

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must have at most 120 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(160, "Email must have at most 160 characters."),
  role: z.enum(["ADMIN", "USER"]),
  allowanceEnabled: z.boolean(),
});

export const createFamilyMemberSchema = baseSchema.extend({
  password: z
    .string()
    .min(8, "Password must have at least 8 characters.")
    .max(72, "Password must have at most 72 characters."),
});

export const updateFamilyMemberSchema = baseSchema.extend({
  password: z
    .string()
    .max(72, "Password must have at most 72 characters.")
    .refine(
      (value) => value.length === 0 || value.length >= 8,
      "Password must have at least 8 characters.",
    ),
});

export type CreateFamilyMemberFormValues = z.infer<
  typeof createFamilyMemberSchema
>;
export type UpdateFamilyMemberFormValues = z.infer<
  typeof updateFamilyMemberSchema
>;
