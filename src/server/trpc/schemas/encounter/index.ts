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

/**
 * Starting a fight: every combatant's initiative in one write.
 *
 * The whole order arrives together because that is how it is settled at the
 * table — the DM goes round asking, then the fight begins. Sending them one at
 * a time would put the encounter through states where half the party has
 * rolled and half has not.
 */
export const startEncounterInputSchema = z.object({
  initiatives: z
    .array(
      z.object({
        id: z.uuid(),
        initiative: z.number().int().min(-20).max(50),
      }),
    )
    .max(200)
    .default([]),
});

export type StartEncounterInput = z.infer<typeof startEncounterInputSchema>;

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

export const addConditionInputSchema = z.object({
  combatantId: z.uuid(),
  conditionSlug: z.string().min(1).max(200),
  /** Null or absent means indefinite — Prone lasts until someone stands up. */
  roundsRemaining: z.number().int().min(1).max(100).nullish(),
  note: z.string().trim().max(200).optional(),
});

export const conditionIdInputSchema = z.object({ id: z.uuid() });
