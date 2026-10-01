import {
  bastionEvents,
  guestKinds,
  treasureRows,
  type BastionEventDefinition,
} from '~/content/bastion/events';

/** Away from the bastion (and not reaching it by magic) means Maintain. */
export const isMaintaining = (actor: {
  isPresent: boolean;
  maintain: boolean;
}): boolean => !actor.isPresent || actor.maintain;

/** Every bastion turn is seven days of in-game time. */
export const TURN_DAYS = 7;

/** The Bastion Event a d100 roll lands on (100 is the 00 on the die). */
export const eventForRoll = (roll: number): BastionEventDefinition =>
  bastionEvents.find(event => roll >= event.from && roll <= event.to) ??
  bastionEvents[0]!;

export const treasureForRoll = (roll: number): string =>
  treasureRows.find(row => roll >= row.from && row.to >= roll)?.label ??
  treasureRows[0]!.label;

export const guestForRoll = (roll: number) =>
  guestKinds.find(kind => kind.roll === roll) ?? guestKinds[0];

/**
 * The dice an Attack rolls for defender losses: six, two fewer when the
 * walls fully enclose the bastion, one fewer per War Room lieutenant housed
 * there; d8s instead of d6s while the Armory is stocked.
 */
export const attackDice = ({
  isFullyEnclosed,
  isArmoryStocked,
  lieutenants = 0,
}: {
  isFullyEnclosed: boolean;
  isArmoryStocked: boolean;
  lieutenants?: number;
}) => ({
  count: Math.max(0, 6 - (isFullyEnclosed ? 2 : 0) - lieutenants),
  sides: isArmoryStocked ? 8 : 6,
});

/**
 * Defenders an Attack kills: one per die showing 1, never more than there
 * are — and none at all while a friendly monster is staying.
 */
export const attackLosses = ({
  ones,
  defenders,
  hasGuestMonster,
}: {
  ones: number;
  defenders: number;
  hasGuestMonster: boolean;
}): number => (hasGuestMonster ? 0 : Math.min(Math.max(ones, 0), defenders));

/**
 * Request for Aid: the d6s rolled for the defenders sent. 10 or more earns
 * the 1d6 × 100 GP reward; less earns half of it, and one defender dies.
 */
export const requestForAidOutcome = ({
  total,
  rewardRoll,
}: {
  total: number;
  rewardRoll: number;
}) =>
  total >= 10
    ? { goldGained: rewardRoll * 100, defendersLost: 0 }
    : { goldGained: Math.floor((rewardRoll * 100) / 2), defendersLost: 1 };

export type EventInputs = Readonly<Record<string, number>>;

export type EventOutcome = {
  goldGained: number;
  goldPaid: number;
  defendersGained: number;
  defendersLost: number;
  guestKind: 'renowned' | 'sanctuary' | 'mercenary' | 'monster' | null;
};

const noOutcome: EventOutcome = {
  goldGained: 0,
  goldPaid: 0,
  defendersGained: 0,
  defendersLost: 0,
  guestKind: null,
};

/** A typed die result, or 0 while it has not been rolled yet. */
const dieValue = (inputs: EventInputs, key: string, sides: number): number => {
  const value = inputs[key] ?? 0;
  return value >= 1 && value <= sides ? value : 0;
};

/**
 * What a Bastion Event comes to, from the dice and choices entered for it.
 * Pure, and the one place each event's arithmetic lives: the wizard shows
 * it as the DM types, the draft stores it, the commit applies it. Keys:
 *
 * - attack: `ones` (dice showing 1)
 * - criminal-hireling: `bribeRoll` (1d6), `pay` (1 = paid)
 * - extraordinary-opportunity: `accept` (1 = paid 500 GP)
 * - friendly-visitors: `roll` (1d6)
 * - guest: `kindRoll` (1d4), `giftRoll` (1d6, a sanctuary guest's gift)
 * - refugees: `payRoll` (1d6)
 * - request-for-aid: `help` (1 = sent defenders), `total` (their d6s),
 *   `rewardRoll` (1d6)
 */
export const resolveEventOutcome = (
  key: string,
  inputs: EventInputs,
  bastion: { defenderCount: number; hasGuestMonster: boolean },
): EventOutcome => {
  if (key === 'attack') {
    return {
      ...noOutcome,
      defendersLost: attackLosses({
        ones: inputs.ones ?? 0,
        defenders: bastion.defenderCount,
        hasGuestMonster: bastion.hasGuestMonster,
      }),
    };
  }

  if (key === 'criminal-hireling') {
    return inputs.pay === 1
      ? { ...noOutcome, goldPaid: dieValue(inputs, 'bribeRoll', 6) * 100 }
      : noOutcome;
  }

  if (key === 'extraordinary-opportunity') {
    return inputs.accept === 1 ? { ...noOutcome, goldPaid: 500 } : noOutcome;
  }

  if (key === 'friendly-visitors') {
    return { ...noOutcome, goldGained: dieValue(inputs, 'roll', 6) * 100 };
  }

  if (key === 'guest') {
    const kindRoll = dieValue(inputs, 'kindRoll', 4);
    if (!kindRoll) return noOutcome;
    const kind = guestForRoll(kindRoll).key;

    return {
      ...noOutcome,
      guestKind: kind,
      goldGained:
        kind === 'sanctuary' ? dieValue(inputs, 'giftRoll', 6) * 100 : 0,
      defendersGained: kind === 'mercenary' ? 1 : 0,
    };
  }

  if (key === 'refugees') {
    return { ...noOutcome, goldGained: dieValue(inputs, 'payRoll', 6) * 100 };
  }

  if (key === 'request-for-aid') {
    const rewardRoll = dieValue(inputs, 'rewardRoll', 6);
    if (inputs.help !== 1 || !rewardRoll) return noOutcome;

    const outcome = requestForAidOutcome({
      total: inputs.total ?? 0,
      rewardRoll,
    });
    return {
      ...noOutcome,
      goldGained: outcome.goldGained,
      defendersLost: Math.min(outcome.defendersLost, bastion.defenderCount),
    };
  }

  return noOutcome;
};
