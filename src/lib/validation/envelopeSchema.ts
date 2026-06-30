import { z } from "zod";
import type { EnvelopeType } from "../../app/api/envelopes";

const ENVELOPE_TYPE_VALUES = [
  "GLOBAL",
  "ALLOWANCE",
] as const satisfies readonly EnvelopeType[];

export const envelopeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(120, "Name must have at most 120 characters."),
    type: z.enum(ENVELOPE_TYPE_VALUES, {
      errorMap: () => ({ message: "Type is required." }),
    }),
    ownerMemberId: z.string(),
    categoryIds: z.array(z.string()),
    monthlyLimit: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().positive("Monthly limit must be greater than zero."),
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
        message: "Owner member is required for allowance envelopes.",
      });
    }

    if (values.type === "GLOBAL" && values.categoryIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryIds"],
        message: "Select at least one category for global envelopes.",
      });
    }
  });

export const archiveEnvelopeSchema = z.object({
  archivedFromMonth: z.string().min(1, "Archive month is required."),
});

export type EnvelopeFormValues = z.infer<typeof envelopeSchema>;
export type ArchiveEnvelopeFormValues = z.infer<typeof archiveEnvelopeSchema>;
