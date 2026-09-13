import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';

/**
 * The bounds are deliberately generous rather than rules-accurate: a DM may
 * legitimately want a level 20 character with 400 hit points, and the app
 * should not argue with the table about it.
 */
const characterFieldsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  playerName: z.string().trim().max(80).optional(),
  armorClass: z.number().int().min(0).max(40),
  maxHitPoints: z.number().int().min(1).max(999),
  initiativeModifier: z.number().int().min(-10).max(20).default(0),
  level: z.number().int().min(1).max(20).default(1),
});

export const createCharacterInputSchema = characterFieldsSchema;

export const updateCharacterInputSchema = characterFieldsSchema.extend({
  id: z.uuid(),
});

export const characterIdInputSchema = idInputSchema;

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterInputSchema>;
