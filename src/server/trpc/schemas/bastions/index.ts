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

const bastionNameSchema = z.string().trim().min(1).max(80);

/** The two free rooms a character brings: one Cramped, one Roomy, their pick. */
const freeRoomsSchema = z.object({
  crampedBasicType: basicTypeSchema,
  roomyBasicType: basicTypeSchema,
});

/**
 * Founding a bastion. Per character: who owns it and their two free rooms.
 * For the party: one shared bastion, every member bringing their own two
 * free rooms — which is what makes it "a lot bigger" (DECISIONS #34).
 */
export const foundBastionInputSchema = z.discriminatedUnion('mode', [
  freeRoomsSchema.extend({
    mode: z.literal('per-character'),
    ownerCharacterId: z.uuid(),
    name: bastionNameSchema,
  }),
  z.object({
    mode: z.literal('party'),
    name: bastionNameSchema,
    members: z
      .array(freeRoomsSchema.extend({ characterId: z.uuid() }))
      .min(1)
      .max(200),
  }),
]);

/** A party member who reached level 5 later brings their free rooms. */
export const addFreeRoomsInputSchema = freeRoomsSchema.extend({
  bastionId: z.uuid(),
  characterId: z.uuid(),
});

/**
 * Switching the campaign's bastion mode. Merging names the new party
 * bastion; splitting names who keeps the shared parts (DECISIONS #34).
 */
export const setBastionModeInputSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('party'), name: bastionNameSchema }),
  z.object({
    mode: z.literal('per-character'),
    keeperCharacterId: z.uuid().optional(),
  }),
]);

export const updateBastionInputSchema = z.object({
  id: z.uuid(),
  name: bastionNameSchema,
  notes: z.string().trim().max(4000).optional(),
  defenderCount: z.number().int().min(0).max(1000),
  wallSquares: z.number().int().min(0).max(10_000),
  isFullyEnclosed: z.boolean(),
});

export const addSpecialFacilityInputSchema = z.object({
  bastionId: z.uuid(),
  facilityKey: z.string().min(1).max(80),
  /**
   * The member who takes it, in a party bastion. Ignored in a per-character
   * bastion, where the owner always holds it.
   */
  holderCharacterId: z.uuid().optional(),
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
