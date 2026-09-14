import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';
import {
  actionSchema as customCreatureActionSchema,
  attackSchema as customCreatureAttackSchema,
} from '~/server/trpc/schemas/customCreatures';

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

/**
 * Materializes a class/subclass/level onto an existing PC (issue #5,
 * milestone 2). `subclassSlug` is optional — a level-1 character often
 * hasn't picked one yet.
 */
export const applyClassTemplateInputSchema = z.object({
  id: z.uuid(),
  characterClassSlug: z.string().trim().min(1),
  subclassSlug: z.string().trim().min(1).optional(),
  level: z.number().int().min(1).max(20),
});

export type ApplyClassTemplateInput = z.infer<
  typeof applyClassTemplateInputSchema
>;

const RESOURCE_RESET_TIMINGS = ['SHORT_REST', 'LONG_REST'] as const;

const characterSpellSchema = z.object({
  spellSlug: z.string().trim().min(1),
  isPrepared: z.boolean().default(true),
  isAlwaysAvailable: z.boolean().default(false),
});

const characterSpellSlotSchema = z.object({
  spellLevel: z.number().int().min(1).max(9),
  maxSlots: z.number().int().min(0).max(20),
});

const characterResourceSchema = z.object({
  resourceKey: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  maxUses: z.number().int().min(0).max(999).optional(),
  isUnlimited: z.boolean().default(false),
  resetsOn: z.enum(RESOURCE_RESET_TIMINGS),
});

/**
 * Replaces every materialized action/spell/slot/resource row for a PC in one
 * go — the same "full replace on save" shape `customCreatures.update` uses
 * for its own child rows, rather than granular per-row CRUD endpoints.
 */
export const updateCombatDataInputSchema = z.object({
  id: z.uuid(),
  actions: z.array(customCreatureActionSchema).default([]),
  spells: z.array(characterSpellSchema).default([]),
  spellSlots: z.array(characterSpellSlotSchema).default([]),
  resources: z.array(characterResourceSchema).default([]),
});

export type UpdateCombatDataInput = z.infer<typeof updateCombatDataInputSchema>;
export type CharacterActionInput = z.infer<typeof customCreatureActionSchema>;
export type CharacterAttackInput = z.infer<typeof customCreatureAttackSchema>;
export type CharacterSpellInput = z.infer<typeof characterSpellSchema>;
export type CharacterSpellSlotInput = z.infer<typeof characterSpellSlotSchema>;
export type CharacterResourceInput = z.infer<typeof characterResourceSchema>;
