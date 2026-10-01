import { toTurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnDraft, TurnEvent } from '~/server/trpc/schemas/bastionTurns';

/**
 * Shared story data for the bastion turn: one party bastion where Wren holds
 * an Arcane Study that just finished a book and Sigrid holds a Barrack, plus
 * a wall going up. Built through `toTurnContext`, so the stories see exactly
 * the shape the server sends.
 */
export const HALL = '00000000-0000-4000-8000-00000000000b';
export const SIGRID = '00000000-0000-4000-8000-000000000001';
export const WREN = '00000000-0000-4000-8000-000000000002';
export const STUDY = '00000000-0000-4000-8000-0000000000f1';
export const BARRACK = '00000000-0000-4000-8000-0000000000f2';

export const turnContext = toTurnContext({
  turnNumber: 4,
  treasuryGold: 1500,
  bastions: [
    {
      id: HALL,
      name: 'The Hall',
      ownerCharacterId: null,
      defenderCount: 4,
      isFullyEnclosed: false,
      isArmoryStocked: false,
      hasGuestMonster: false,
    },
  ],
  facilities: [
    {
      id: STUDY,
      bastionId: HALL,
      facilityKey: 'arcane-study',
      holderCharacterId: WREN,
      jobOptionKey: 'book',
      jobNote: null,
      jobDaysRemaining: 7,
      outOfActionTurns: 0,
    },
    {
      id: BARRACK,
      bastionId: HALL,
      facilityKey: 'barrack',
      holderCharacterId: SIGRID,
      jobOptionKey: null,
      jobNote: null,
      jobDaysRemaining: 0,
      outOfActionTurns: 0,
    },
  ],
  projects: [
    {
      id: 'p1',
      bastionId: HALL,
      description: 'Build 8 squares of wall',
      daysRemaining: 30,
    },
  ],
  characters: [
    { id: SIGRID, name: 'Sigrid', isActive: true },
    { id: WREN, name: 'Wren', isActive: true },
  ],
});

export const turnBastion = turnContext.bastions[0]!;

export const event = (overrides: Partial<TurnEvent> = {}): TurnEvent => ({
  bastionId: HALL,
  characterId: SIGRID,
  roll: 0,
  key: 'all-is-well',
  goldGained: 0,
  goldPaid: 0,
  defendersGained: 0,
  defendersLost: 0,
  outOfActionFacilityId: null,
  storageItem: '',
  guestKind: null,
  note: '',
  inputs: {},
  ...overrides,
});

export const turnDraft = (overrides: Partial<TurnDraft> = {}): TurnDraft => ({
  step: 'since',
  completions: [
    {
      facilityId: STUDY,
      itemName: 'Blank book',
      quantity: 1,
      goldGained: 0,
      defendersGained: 0,
    },
  ],
  actors: [
    {
      bastionId: HALL,
      characterId: SIGRID,
      isPresent: true,
      maintain: false,
      facilityOrders: [],
    },
    {
      bastionId: HALL,
      characterId: WREN,
      isPresent: true,
      maintain: false,
      facilityOrders: [],
    },
  ],
  events: [],
  ...overrides,
});
