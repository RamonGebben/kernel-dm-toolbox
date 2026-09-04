import { z } from 'zod';

export const addCreatureInputSchema = z.object({
  slug: z.string().min(1).max(200),
  /** Four goblins in one action; each becomes its own row. */
  count: z.number().int().min(1).max(20).default(1),
});

export const addCharacterInputSchema = z.object({
  playerCharacterId: z.uuid(),
  /** Players roll their own dice; the DM types the result. */
  initiative: z.number().int().min(-20).max(50),
});

export const combatantIdInputSchema = z.object({ id: z.uuid() });

export const updateCombatantInputSchema = z.object({
  id: z.uuid(),
  displayName: z.string().trim().min(1).max(80).optional(),
  initiative: z.number().int().min(-20).max(50).optional(),
  currentHitPoints: z.number().int().min(0).max(9999).optional(),
  maxHitPoints: z.number().int().min(1).max(9999).optional(),
  temporaryHitPoints: z.number().int().min(0).max(9999).optional(),
  isHidden: z.boolean().optional(),
});

export const adjustHitPointsInputSchema = z.object({
  id: z.uuid(),
  amount: z.number().int().min(1).max(9999),
});

export type AddCreatureInput = z.infer<typeof addCreatureInputSchema>;
export type UpdateCombatantInput = z.infer<typeof updateCombatantInputSchema>;
