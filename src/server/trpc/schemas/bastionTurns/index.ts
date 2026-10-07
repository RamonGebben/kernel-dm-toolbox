import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';

const gold = z.number().int().min(0).max(100_000_000);

export const turnSteps = [
  'since',
  'presence',
  'orders',
  'events',
  'review',
] as const;

export type TurnStep = (typeof turnSteps)[number];

/**
 * A facility's job that finished during the seven days, and what it produced
 * — the DM fills this in from the players: the item made, gold earned (a
 * Gaming Hall's winnings, a Storehouse sale), defenders recruited.
 */
const completionSchema = z.object({
  facilityId: z.uuid(),
  itemName: z.string().trim().max(120).default(''),
  quantity: z.number().int().min(1).max(10_000).default(1),
  goldGained: gold.default(0),
  defendersGained: z.number().int().min(0).max(100).default(0),
  /** What the stored lot is worth, for goods a Storehouse bought. */
  valueGp: gold.optional(),
});

/** One order to one facility: which option, what it cost, any detail. */
const facilityOrderSchema = z.object({
  facilityId: z.uuid(),
  optionKey: z.string().min(1).max(80),
  costGp: gold.default(0),
  note: z.string().trim().max(500).default(''),
  /** The stored lot a Storehouse is told to sell. */
  storageItemId: z.uuid().optional(),
  /** How many Bastion Defenders a Barrack is told to recruit. */
  quantity: z.number().int().min(1).max(100).optional(),
});

/**
 * One character taking the turn for one bastion — the owner in their own
 * bastion, each member in turn in the party's. Away (and out of reach of
 * Sending) means Maintain whatever is chosen; Maintain means no facility
 * orders, and one Bastion Event roll.
 */
const actorSchema = z.object({
  bastionId: z.uuid(),
  characterId: z.uuid(),
  isPresent: z.boolean(),
  maintain: z.boolean(),
  facilityOrders: z.array(facilityOrderSchema).max(20),
});

/**
 * A Bastion Event and what came of it. The wizard walks the DM through each
 * event's own steps; what it records here is the plain outcome — gold in
 * and out, defenders gained and lost, a facility put out of action, an item
 * found — so committing never has to know one event from another.
 */
const eventSchema = z.object({
  bastionId: z.uuid(),
  characterId: z.uuid(),
  /** The d100; 0 while it has not been rolled yet. */
  roll: z.number().int().min(0).max(100),
  key: z.enum([
    'all-is-well',
    'attack',
    'criminal-hireling',
    'extraordinary-opportunity',
    'friendly-visitors',
    'guest',
    'lost-hirelings',
    'magical-discovery',
    'refugees',
    'request-for-aid',
    'treasure',
  ]),
  goldGained: gold.default(0),
  goldPaid: gold.default(0),
  defendersGained: z.number().int().min(0).max(100).default(0),
  defendersLost: z.number().int().min(0).max(1000).default(0),
  outOfActionFacilityId: z.uuid().nullable().default(null),
  storageItem: z.string().trim().max(120).default(''),
  guestKind: z
    .enum(['renowned', 'sanctuary', 'mercenary', 'monster'])
    .nullable()
    .default(null),
  note: z.string().trim().max(500).default(''),
  /**
   * The event's own dice and choices as entered — a bribe roll, whether the
   * bribe was paid, the d6s sent to aid — so a resumed turn shows them again.
   * `resolveEventOutcome` turns them into the outcome fields above.
   */
  inputs: z.record(z.string(), z.number().int()).default({}),
});

export const turnDraftSchema = z.object({
  step: z.enum(turnSteps),
  completions: z.array(completionSchema).max(200),
  actors: z.array(actorSchema).max(200),
  events: z.array(eventSchema).max(400),
});

export type TurnDraft = z.infer<typeof turnDraftSchema>;
export type TurnDraftInput = z.input<typeof turnDraftSchema>;
export type TurnActor = TurnDraft['actors'][number];
export type TurnEvent = TurnDraft['events'][number];
export type TurnCompletion = TurnDraft['completions'][number];
export type TurnFacilityOrder = TurnActor['facilityOrders'][number];

export const saveTurnDraftInputSchema = z.object({
  id: z.uuid(),
  draft: turnDraftSchema,
});

export const turnIdInputSchema = idInputSchema;
