import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';

export const createScenarioInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  note: z.string().trim().max(200).optional(),
});

export type CreateScenarioInput = z.infer<typeof createScenarioInputSchema>;

export const updateScenarioInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  note: z.string().trim().max(200).optional(),
  /** Capped like BattleCast's own Monte Carlo trial limit (issue #5). */
  trialCount: z.number().int().min(1).max(10000),
});

export type UpdateScenarioInput = z.infer<typeof updateScenarioInputSchema>;

export const scenarioIdInputSchema = idInputSchema;

/** Null clears a placement back to "let the engine auto-place this one". */
const positionInputSchema = z
  .object({ x: z.number().int().min(0), y: z.number().int().min(0) })
  .nullable();

export const addPartyMemberInputSchema = z.object({
  scenarioId: z.uuid(),
  playerCharacterId: z.uuid(),
});

export type AddPartyMemberInput = z.infer<typeof addPartyMemberInputSchema>;

export const setPartyMemberPositionInputSchema = z.object({
  id: z.uuid(),
  position: positionInputSchema,
});

export type SetPartyMemberPositionInput = z.infer<
  typeof setPartyMemberPositionInputSchema
>;

/** Exactly one of `creatureSlug`/`customCreatureId` — the same XOR the DB
 * check constraint enforces, validated early so the router can return a
 * normal `BAD_REQUEST` instead of relying on the constraint to reject it. */
export const addMonsterEntryInputSchema = z
  .object({
    scenarioId: z.uuid(),
    creatureSlug: z.string().min(1).max(200).optional(),
    customCreatureId: z.uuid().optional(),
    count: z.number().int().min(1).max(50).default(1),
  })
  .refine(
    value =>
      (value.creatureSlug !== undefined) !==
      (value.customCreatureId !== undefined),
    {
      message: 'Exactly one of creatureSlug or customCreatureId is required.',
    },
  );

export type AddMonsterEntryInput = z.infer<typeof addMonsterEntryInputSchema>;

export const updateMonsterEntryCountInputSchema = z.object({
  id: z.uuid(),
  count: z.number().int().min(1).max(50),
});

export type UpdateMonsterEntryCountInput = z.infer<
  typeof updateMonsterEntryCountInputSchema
>;

export const setMonsterEntryPositionInputSchema = z.object({
  id: z.uuid(),
  position: positionInputSchema,
});

export type SetMonsterEntryPositionInput = z.infer<
  typeof setMonsterEntryPositionInputSchema
>;
