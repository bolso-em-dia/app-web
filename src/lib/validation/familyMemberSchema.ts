import { z } from "zod";

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail válido.")
    .max(160, "O e-mail deve ter no máximo 160 caracteres."),
  role: z.enum(["ADMIN", "USER"]),
  allowanceEnabled: z.boolean(),
});

export const createFamilyMemberSchema = baseSchema.extend({
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres."),
});

export const updateFamilyMemberSchema = baseSchema.extend({
  password: z
    .string()
    .max(72, "A senha deve ter no máximo 72 caracteres.")
    .refine(
      (value) => value.length === 0 || value.length >= 8,
      "A senha deve ter pelo menos 8 caracteres.",
    ),
});

export type CreateFamilyMemberFormValues = z.infer<
  typeof createFamilyMemberSchema
>;
export type UpdateFamilyMemberFormValues = z.infer<
  typeof updateFamilyMemberSchema
>;
