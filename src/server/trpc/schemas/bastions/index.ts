import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';

const spaceSchema = z.enum(['cramped', 'roomy', 'vast']);

const basicTypeSchema = z.enum([
  'bedroom',
  'dining-room',
  'parlor',
  'courtyard',
  'kitchen',
  'storage',
]);

/**
 * Founding a bastion: who owns it, what it is called, and the two free basic
 * facilities it starts with — one Cramped, one Roomy, the player's pick.
 */
export const foundBastionInputSchema = z.object({
  ownerCharacterId: z.uuid(),
  name: z.string().trim().min(1).max(80),
  crampedBasicType: basicTypeSchema,
  roomyBasicType: basicTypeSchema,
});

export const updateBastionInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(4000).optional(),
  defenderCount: z.number().int().min(0).max(1000),
  wallSquares: z.number().int().min(0).max(10_000),
  isFullyEnclosed: z.boolean(),
});

export const addSpecialFacilityInputSchema = z.object({
  bastionId: z.uuid(),
  facilityKey: z.string().min(1).max(80),
  variant: z.string().trim().max(80).optional(),
  /**
   * Take it even though the level, prerequisite, duplicate or allowance
   * rules say no. The DM's call (DECISIONS #33) — but an explicit one, so a
   * stray click cannot slip past the rules.
   */
  ignoreRequirements: z.boolean().default(false),
});

export const setFacilityVariantInputSchema = z.object({
  id: z.uuid(),
  variant: z.string().trim().max(80).nullable(),
});

/** A basic facility that is simply there — free, no construction time. */
export const addBasicFacilityInputSchema = z.object({
  bastionId: z.uuid(),
  type: basicTypeSchema,
  space: spaceSchema,
});

export const startProjectInputSchema = z.object({
  bastionId: z.uuid(),
  request: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('add-basic'),
      basicType: basicTypeSchema,
      space: spaceSchema,
    }),
    z.object({ kind: z.literal('enlarge-basic'), facilityId: z.uuid() }),
    z.object({ kind: z.literal('enlarge-special'), facilityId: z.uuid() }),
    z.object({
      kind: z.literal('walls'),
      squares: z.number().int().min(1).max(1000),
    }),
  ]),
});

export const addStorageItemInputSchema = z.object({
  bastionId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(10_000).default(1),
  note: z.string().trim().max(500).optional(),
});

/** Null un-claims an item handed out by mistake. */
export const claimStorageItemInputSchema = z.object({
  id: z.uuid(),
  characterId: z.uuid().nullable(),
});

export const bastionIdInputSchema = idInputSchema;
export const bastionRowIdInputSchema = idInputSchema;

export type StartProjectInput = z.infer<typeof startProjectInputSchema>;
