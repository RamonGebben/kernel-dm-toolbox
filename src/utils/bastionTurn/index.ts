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

/** "1 defender", "3 defenders": how the turn log and the hints count them. */
export const countDefenders = (count: number): string =>
  `${count} defender${count === 1 ? '' : 's'}`;

/**
 * Stocking the Armory: 100 GP plus 100 GP per Bastion Defender, halved when
 * the bastion has a Smithy.
 */
export const armoryStockCost = ({
  defenders,
  hasSmithy,
}: {
  defenders: number;
  hasSmithy: boolean;
}): number => {
  const full = 100 + 100 * Math.max(0, defenders);
  return hasSmithy ? full / 2 : full;
};

/** The most Bastion Defenders one Recruit order to a Barrack brings in. */
export const MAX_RECRUITS = 4;

/**
 * How many defenders to suggest recruiting: as many as the order allows, or
 * as many as the barracks still have bunks for when that is fewer. Capacity
 * is a guide (`defenderCapacity`), so a full barrack still suggests the lot
 * and leaves it to the DM.
 */
export const suggestedRecruits = ({
  capacity,
  defenders,
}: {
  capacity: number;
  defenders: number;
}): number => {
  const free = capacity - defenders;
  return free > 0 ? Math.min(MAX_RECRUITS, free) : MAX_RECRUITS;
};

/** The most a Storehouse can buy in one order, by the level of who orders it. */
export const storehouseBuyLimit = (level: number): number => {
  if (level >= 13) return 5000;
  if (level >= 9) return 2000;
  return 500;
};

/** The profit, in percent, a Storehouse makes selling its goods. */
export const storehouseSellMargin = (level: number): number => {
  if (level >= 17) return 100;
  if (level >= 13) return 50;
  if (level >= 9) return 20;
  return 10;
};

/** What goods bought for this much sell for, in whole gold pieces. */
export const storehouseSalePrice = (valueGp: number, level: number): number =>
  valueGp + Math.floor((valueGp * storehouseSellMargin(level)) / 100);

/**
 * Orders one character can give in a turn. By the book they order their own
 * special facilities, so it is as many as their level allows them. A pooled
 * bastion lets them spend those on any facility (DECISIONS #34), and someone
 * the DM let hold more than their level allows can still order all of theirs.
 */
export const orderLimit = ({
  allowance,
  held,
}: {
  allowance: number;
  held: number;
}): number => Math.max(allowance, held);

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

export interface EventOutcome {
  goldGained: number;
  goldPaid: number;
  defendersGained: number;
  defendersLost: number;
  guestKind: 'renowned' | 'sanctuary' | 'mercenary' | 'monster' | null;
}

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
