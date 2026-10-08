import { z } from 'zod';

/**
 * A deposit (positive) or withdrawal (negative) against the treasury. Zero is
 * refused: a no-op write would still bump the row's sync version.
 */
export const adjustTreasuryInputSchema = z.object({
  delta: z
    .number()
    .int()
    .min(-100_000_000)
    .max(100_000_000)
    .refine(delta => delta !== 0, 'A treasury change cannot be zero.'),
});

export type AdjustTreasuryInput = z.infer<typeof adjustTreasuryInputSchema>;
