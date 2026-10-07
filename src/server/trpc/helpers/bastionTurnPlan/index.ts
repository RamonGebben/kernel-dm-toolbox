import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import type {
  FacilityOrderOption,
  FacilitySpace,
} from '~/content/bastion/types';
import { allowanceForLevel, defenderCapacity } from '~/utils/bastionRules';
import {
  armoryStockCost,
  eventForRoll,
  isMaintaining,
  MAX_RECRUITS,
  orderLimit,
  storehouseSalePrice,
  TURN_DAYS,
} from '~/utils/bastionTurn';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';

/**
 * The bastion turn, as pure functions: what the wizard shows
 * (`toTurnContext`), where it starts (`startTurnDraft`), and what committing
 * changes (`planTurnCommit`). The resolver reads rows, asks these, and
 * writes what they say — so every rule here is testable without a database.
 */

type FacilityRow = {
  id: string;
  bastionId: string;
  facilityKey: string;
  space: FacilitySpace;
  holderCharacterId: string | null;
  jobOptionKey: string | null;
  jobNote: string | null;
  jobDaysRemaining: number;
  jobValueGp: number;
  jobQuantity: number;
  outOfActionTurns: number;
};

type StorageRow = {
  id: string;
  bastionId: string;
  name: string;
  valueGp: number | null;
  claimedByCharacterId: string | null;
};

type BastionRow = {
  id: string;
  name: string;
  ownerCharacterId: string | null;
  defenderCount: number;
  isFullyEnclosed: boolean;
  isArmoryStocked: boolean;
  hasGuestMonster: boolean;
};

type ProjectRow = {
  id: string;
  bastionId: string;
  description: string;
  daysRemaining: number;
};

type Character = {
  id: string;
  name: string;
  level: number;
  isActive: boolean;
};

/**
 * An order option as this bastion sees it. Where the cost follows from the
 * bastion itself it is worked out here, so the wizard shows the amount
 * instead of the formula.
 */
const toTurnOrderOption = (
  option: FacilityOrderOption,
  bastion: { defenderCount: number; hasSmithy: boolean },
) => {
  const base = {
    key: option.key,
    label: option.label,
    summary: option.summary,
    durationDays: option.durationDays,
    costGp: option.costGp,
    effect: option.effect ?? null,
    yields: option.yields ?? null,
  };
  if (option.effect !== 'stock-armory') return base;

  const costGp = armoryStockCost({
    defenders: bastion.defenderCount,
    hasSmithy: bastion.hasSmithy,
  });
  const defenders = `${bastion.defenderCount} defender${bastion.defenderCount === 1 ? '' : 's'}`;

  return {
    ...base,
    costGp,
    summary: `${costGp} GP for ${defenders}${bastion.hasSmithy ? ', halved by the Smithy' : ''}. While stocked, defender loss dice are d8 instead of d6.`,
  };
};

export const toTurnContext = ({
  turnNumber,
  treasuryGold,
  bastions,
  facilities,
  projects,
  storage,
  characters,
}: {
  turnNumber: number;
  treasuryGold: number;
  bastions: readonly BastionRow[];
  facilities: readonly FacilityRow[];
  projects: readonly ProjectRow[];
  storage: readonly StorageRow[];
  characters: readonly Character[];
}) => {
  const nameOf = (id: string | null) =>
    characters.find(character => character.id === id)?.name ?? 'Nobody';

  return {
    turnNumber,
    treasuryGold,
    bastions: bastions.map(bastion => {
      const own = facilities.filter(
        facility => facility.bastionId === bastion.id,
      );
      const holderIds = new Set(
        own.map(facility => facility.holderCharacterId),
      );
      const hasSmithy = own.some(facility => facility.facilityKey === 'smithy');

      // The owner takes their own bastion's turn; in the party's, every
      // active member does, plus anyone benched who still holds a facility.
      const actors = bastion.ownerCharacterId
        ? characters.filter(({ id }) => id === bastion.ownerCharacterId)
        : characters.filter(
            character => character.isActive || holderIds.has(character.id),
          );

      return {
        id: bastion.id,
        name: bastion.name,
        kind: bastion.ownerCharacterId
          ? ('character' as const)
          : ('party' as const),
        defenderCount: bastion.defenderCount,
        /** Bunks in the barracks: a guide for recruiting, not a cap. */
        defenderCapacity: defenderCapacity(own),
        isFullyEnclosed: bastion.isFullyEnclosed,
        isArmoryStocked: bastion.isArmoryStocked,
        hasGuestMonster: bastion.hasGuestMonster,
        actors: actors.map(({ id, name, level }) => ({
          id,
          name,
          level,
          /** Orders they can give this turn, across the whole bastion. */
          orderLimit: orderLimit({
            allowance: allowanceForLevel(level),
            held: own.filter(facility => facility.holderCharacterId === id)
              .length,
          }),
        })),
        /** Trade goods in storage a Storehouse could sell. */
        goods: storage
          .filter(
            item =>
              item.bastionId === bastion.id &&
              !item.claimedByCharacterId &&
              (item.valueGp ?? 0) > 0,
          )
          .map(item => ({
            id: item.id,
            name: item.name,
            valueGp: item.valueGp ?? 0,
          })),
        facilities: own.map(facility => {
          const definition = findSpecialFacility(facility.facilityKey);
          const job = definition?.orderOptions.find(
            option => option.key === facility.jobOptionKey,
          );
          const remaining = facility.jobDaysRemaining;

          return {
            id: facility.id,
            facilityKey: facility.facilityKey,
            name: definition?.name ?? facility.facilityKey,
            order: definition?.order ?? 'craft',
            holderId: facility.holderCharacterId,
            holderName: nameOf(facility.holderCharacterId),
            orderOptions: (definition?.orderOptions ?? []).map(option =>
              toTurnOrderOption(option, {
                defenderCount: bastion.defenderCount,
                hasSmithy,
              }),
            ),
            jobOptionKey: facility.jobOptionKey,
            jobLabel: job?.label ?? null,
            /** What the running job produces, for the step that records it. */
            jobSummary: job?.summary ?? null,
            jobEffect: job?.effect ?? null,
            jobYields: job?.yields ?? null,
            jobValueGp: facility.jobValueGp,
            jobQuantity: facility.jobQuantity,
            jobNote: facility.jobNote,
            jobDaysRemaining: remaining,
            /** Its job ends within these seven days. */
            finishesThisTurn: remaining > 0 && remaining <= TURN_DAYS,
            /** Still working after these seven days — no new order. */
            isBusy: remaining > TURN_DAYS,
            outOfActionTurns: facility.outOfActionTurns,
            isOutOfAction: facility.outOfActionTurns > 0,
          };
        }),
        projectsFinishing: projects
          .filter(
            project =>
              project.bastionId === bastion.id &&
              project.daysRemaining <= TURN_DAYS,
          )
          .map(({ id, description }) => ({ id, description })),
        projectsContinuing: projects
          .filter(
            project =>
              project.bastionId === bastion.id &&
              project.daysRemaining > TURN_DAYS,
          )
          .map(({ id, description, daysRemaining }) => ({
            id,
            description,
            daysLeftAfter: daysRemaining - TURN_DAYS,
          })),
      };
    }),
  };
};

export type TurnContext = ReturnType<typeof toTurnContext>;
export type TurnContextBastion = TurnContext['bastions'][number];
export type TurnContextFacility = TurnContextBastion['facilities'][number];

export const TRADE_GOODS = 'Trade goods';

/**
 * What a finished job most likely produced, for the DM to confirm or change.
 * A Storehouse's result is known from the order: the goods it paid for, or
 * the sale it made. A fixed output comes from the catalog. Anything else
 * that is crafted or harvested suggests the job's own name.
 */
const suggestedCompletion = (facility: TurnContextFacility) => {
  const blank = {
    facilityId: facility.id,
    itemName: '',
    quantity: 1,
    goldGained: 0,
    defendersGained: 0,
  };

  if (facility.jobEffect === 'buy-goods') {
    return {
      ...blank,
      itemName: facility.jobNote || TRADE_GOODS,
      valueGp: facility.jobValueGp,
    };
  }
  if (facility.jobEffect === 'sell-goods') {
    return { ...blank, goldGained: facility.jobValueGp };
  }
  if (facility.jobEffect === 'recruit-defenders') {
    // An order from before the count was recorded brings the full four.
    return {
      ...blank,
      defendersGained: facility.jobQuantity || MAX_RECRUITS,
    };
  }
  if (facility.jobYields) {
    return {
      ...blank,
      itemName: facility.jobYields.name,
      quantity: facility.jobYields.quantity,
    };
  }
  if (facility.order === 'craft' || facility.order === 'harvest') {
    return {
      ...blank,
      itemName: facility.jobNote || (facility.jobLabel ?? ''),
    };
  }

  return blank;
};

/**
 * Where a new turn starts: every finished job listed for the DM to record,
 * everyone assumed home with no orders yet.
 */
export const startTurnDraft = (context: TurnContext): TurnDraft => ({
  step: 'since',
  completions: context.bastions.flatMap(bastion =>
    bastion.facilities
      .filter(facility => facility.finishesThisTurn)
      .map(suggestedCompletion),
  ),
  actors: context.bastions.flatMap(bastion =>
    bastion.actors.map(actor => ({
      bastionId: bastion.id,
      characterId: actor.id,
      isPresent: true,
      maintain: false,
      facilityOrders: [],
    })),
  ),
  events: [],
});

export type TurnCommitPlan = {
  treasuryDelta: number;
  bastions: {
    id: string;
    defenderCount: number;
    isArmoryStocked: boolean;
    hasGuestMonster: boolean;
  }[];
  facilities: {
    id: string;
    jobOptionKey: string | null;
    jobNote: string | null;
    jobDaysRemaining: number;
    jobValueGp: number;
    jobQuantity: number;
    outOfActionTurns: number;
  }[];
  projectsToComplete: string[];
  projectsToAdvance: { id: string; daysRemaining: number }[];
  storageItems: {
    bastionId: string;
    name: string;
    quantity: number;
    note: string | null;
    valueGp: number | null;
  }[];
  /** Stored lots a Storehouse was told to sell: gone once the turn commits. */
  storageItemsToRemove: string[];
  /** One line per thing that happened, for the turn's history. */
  lines: string[];
};

export type TurnCommitResult =
  { ok: true; plan: TurnCommitPlan } | { ok: false; problems: string[] };

type FacilityState = { outOfActionTurns: number } & Omit<
  TurnCommitPlan['facilities'][number],
  'outOfActionTurns'
>;

const STALE_DRAFT_ADVICE = 'Discard this turn and start a new one.';

/**
 * A draft fixes which bastions take the turn when it is started. Abandoning
 * a bastion or switching bastion mode after that leaves it describing
 * bastions that are not there any more — their gold, defenders and stored
 * items would land on a tombstone — and missing the ones that are, so nobody
 * could act for them. Refused rather than half-applied.
 */
export const findStaleDraftProblems = (
  draft: TurnDraft,
  context: TurnContext,
): string[] => {
  const liveIds = new Set(context.bastions.map(({ id }) => id));
  const draftedIds = new Set(draft.actors.map(({ bastionId }) => bastionId));

  const isGone =
    draft.actors.some(({ bastionId }) => !liveIds.has(bastionId)) ||
    draft.events.some(({ bastionId }) => !liveIds.has(bastionId));
  if (isGone) {
    return [
      `A bastion in this turn has been abandoned or merged since it was started. ${STALE_DRAFT_ADVICE}`,
    ];
  }

  const added = context.bastions.filter(
    bastion => bastion.actors.length > 0 && !draftedIds.has(bastion.id),
  );
  if (added.length) {
    return [
      `${added.map(({ name }) => name).join(', ')} ${added.length === 1 ? 'is' : 'are'} not part of this turn: ${added.length === 1 ? 'it was' : 'they were'} founded after the turn was started. ${STALE_DRAFT_ADVICE}`,
    ];
  }

  return [];
};

/**
 * Everything a committed turn changes, or the reasons it cannot be
 * committed. In order: seven days pass (construction and jobs count down,
 * finished jobs deliver), out-of-action facilities recover a turn, new orders
 * start and are paid for, then each Bastion Event lands.
 */
export const planTurnCommit = (
  draft: TurnDraft,
  context: TurnContext,
): TurnCommitResult => {
  const allFacilities = context.bastions.flatMap(bastion =>
    bastion.facilities.map(facility => ({
      ...facility,
      bastionId: bastion.id,
    })),
  );
  const facilityById = new Map(
    allFacilities.map(facility => [facility.id, facility]),
  );
  const actorName = (bastionId: string, characterId: string) =>
    context.bastions
      .find(({ id }) => id === bastionId)
      ?.actors.find(({ id }) => id === characterId)?.name ?? 'Someone';

  const stale = findStaleDraftProblems(draft, context);
  if (stale.length) return { ok: false, problems: stale };

  const problems: string[] = [];
  const lines: string[] = [];

  // 1. Seven days pass for every facility.
  const facilityState = new Map<string, FacilityState>(
    allFacilities.map(facility => {
      const remaining = Math.max(0, facility.jobDaysRemaining - TURN_DAYS);
      return [
        facility.id,
        {
          id: facility.id,
          jobOptionKey: remaining > 0 ? facility.jobOptionKey : null,
          jobNote: remaining > 0 ? facility.jobNote : null,
          jobDaysRemaining: remaining,
          jobValueGp: remaining > 0 ? facility.jobValueGp : 0,
          jobQuantity: remaining > 0 ? facility.jobQuantity : 0,
          outOfActionTurns: Math.max(0, facility.outOfActionTurns - 1),
        },
      ];
    }),
  );

  // 2. Finished jobs deliver.
  const storageItems: TurnCommitPlan['storageItems'] = [];
  let treasuryDelta = 0;
  const defenders = new Map(
    context.bastions.map(bastion => [bastion.id, bastion.defenderCount]),
  );
  const armory = new Map(context.bastions.map(b => [b.id, b.isArmoryStocked]));
  const guestMonster = new Map(
    context.bastions.map(b => [b.id, b.hasGuestMonster]),
  );

  for (const completion of draft.completions) {
    const facility = facilityById.get(completion.facilityId);
    if (!facility) continue;

    if (completion.itemName) {
      storageItems.push({
        bastionId: facility.bastionId,
        name: completion.itemName,
        quantity: completion.quantity,
        note: `From the ${facility.name}`,
        valueGp: completion.valueGp || null,
      });
    }
    if (facility.jobEffect === 'stock-armory') {
      armory.set(facility.bastionId, true);
    }
    treasuryDelta += completion.goldGained;
    defenders.set(
      facility.bastionId,
      (defenders.get(facility.bastionId) ?? 0) + completion.defendersGained,
    );

    const stored = completion.itemName
      ? `stored ${completion.itemName}${completion.quantity > 1 ? ` ×${completion.quantity}` : ''}${completion.valueGp ? ` worth ${completion.valueGp} gp` : ''}`
      : null;
    const came = [
      stored,
      completion.goldGained ? `+${completion.goldGained} gp` : null,
      completion.defendersGained
        ? `+${completion.defendersGained} defender${completion.defendersGained === 1 ? '' : 's'}`
        : null,
      facility.jobEffect === 'stock-armory' ? 'the Armory is stocked' : null,
    ].filter(Boolean);
    lines.push(
      `${facility.name} finished ${facility.jobLabel ?? 'its job'}${came.length ? `: ${came.join(', ')}` : ''}.`,
    );
  }

  // 3. New orders, from whoever is home and not maintaining.
  const ordered = new Set<string>();
  const storageItemsToRemove: string[] = [];
  for (const actor of draft.actors) {
    const who = actorName(actor.bastionId, actor.characterId);
    const bastion = context.bastions.find(({ id }) => id === actor.bastionId);
    const member = bastion?.actors.find(({ id }) => id === actor.characterId);

    if (isMaintaining(actor)) {
      const hasEvent = draft.events.some(
        event =>
          event.bastionId === actor.bastionId &&
          event.characterId === actor.characterId &&
          event.roll >= 1,
      );
      if (!hasEvent)
        problems.push(`${who} maintains but has no Bastion Event rolled.`);
      lines.push(
        `${who} ${actor.isPresent ? 'maintained' : 'was away; the bastion was maintained'}.`,
      );
      continue;
    }

    const limit = member?.orderLimit ?? 0;
    if (actor.facilityOrders.length > limit) {
      problems.push(
        `${who} gave ${actor.facilityOrders.length} orders but can give ${limit} this turn.`,
      );
    }

    for (const order of actor.facilityOrders) {
      const facility = facilityById.get(order.facilityId);
      const state = facilityState.get(order.facilityId);
      const option = facility?.orderOptions.find(
        ({ key }) => key === order.optionKey,
      );

      if (!facility || !state || !option) {
        problems.push(
          `${who} gave an order to a facility or option that no longer exists.`,
        );
        continue;
      }
      // Any facility in the bastion: in a party bastion everyone uses all of
      // them, whoever took it (DECISIONS #34) — one order each per turn.
      if (facility.bastionId !== actor.bastionId) {
        problems.push(`The ${facility.name} is not in ${who}'s bastion.`);
        continue;
      }
      if (facility.isBusy) {
        problems.push(`The ${facility.name} is still busy with its last job.`);
        continue;
      }
      if (facility.isOutOfAction) {
        problems.push(`The ${facility.name} is out of action this turn.`);
        continue;
      }
      if (ordered.has(facility.id)) {
        problems.push(`The ${facility.name} was given two orders.`);
        continue;
      }

      // Selling takes a lot out of storage now; the gold comes in when the
      // sale finishes, at the margin of whoever ordered it.
      const lot =
        option.effect === 'sell-goods'
          ? bastion?.goods.find(({ id }) => id === order.storageItemId)
          : undefined;
      if (option.effect === 'sell-goods') {
        if (!lot || storageItemsToRemove.includes(lot.id)) {
          problems.push(
            `The ${facility.name} was told to sell goods that are not in storage.`,
          );
          continue;
        }
        storageItemsToRemove.push(lot.id);
      }
      const salePrice = lot
        ? storehouseSalePrice(lot.valueGp, member?.level ?? 0)
        : 0;
      const jobValueGp =
        option.effect === 'buy-goods' ? order.costGp : salePrice;
      const recruits =
        option.effect === 'recruit-defenders'
          ? Math.min(order.quantity ?? MAX_RECRUITS, MAX_RECRUITS)
          : 0;

      ordered.add(facility.id);
      facilityState.set(facility.id, {
        ...state,
        jobOptionKey: option.key,
        jobNote: order.note || null,
        jobDaysRemaining: option.durationDays ?? TURN_DAYS,
        jobValueGp,
        jobQuantity: recruits,
      });
      treasuryDelta -= order.costGp;

      const detail = lot
        ? `${lot.name} worth ${lot.valueGp} gp, for ${salePrice} gp`
        : recruits
          ? `${recruits} defender${recruits === 1 ? '' : 's'}`
          : order.costGp
            ? `${order.costGp} gp`
            : '';
      lines.push(
        `${who}: ${facility.name}, ${option.label}${detail ? ` (${detail})` : ''}.`,
      );
    }
  }

  // 4. Bastion Events.
  for (const event of draft.events.filter(({ roll }) => roll >= 1)) {
    const bastionId = event.bastionId;
    const who = actorName(bastionId, event.characterId);
    const name = eventForRoll(event.roll).name;

    treasuryDelta += event.goldGained - event.goldPaid;

    const isAttack = event.key === 'attack';
    const lost =
      isAttack && guestMonster.get(bastionId) ? 0 : event.defendersLost;
    defenders.set(
      bastionId,
      Math.max(
        0,
        (defenders.get(bastionId) ?? 0) + event.defendersGained - lost,
      ),
    );

    if (isAttack) {
      armory.set(bastionId, false);
      guestMonster.set(bastionId, false);
    }
    if (event.guestKind === 'monster') guestMonster.set(bastionId, true);

    // A bribed hireling stays on: the facility keeps working.
    const isBribed =
      event.key === 'criminal-hireling' && event.inputs.pay === 1;
    if (event.outOfActionFacilityId && !isBribed) {
      const state = facilityState.get(event.outOfActionFacilityId);
      if (state) {
        facilityState.set(state.id, {
          ...state,
          outOfActionTurns: Math.max(state.outOfActionTurns, 1),
        });
      }
    }

    if (event.storageItem) {
      storageItems.push({
        bastionId,
        name: event.storageItem,
        quantity: 1,
        note: name,
        valueGp: null,
      });
    }

    const outcome = [
      event.goldGained ? `+${event.goldGained} gp` : null,
      event.goldPaid ? `paid ${event.goldPaid} gp` : null,
      event.defendersGained
        ? `+${event.defendersGained} defender${event.defendersGained === 1 ? '' : 's'}`
        : null,
      lost ? `${lost} defender${lost === 1 ? '' : 's'} lost` : null,
      event.outOfActionFacilityId && !isBribed
        ? `${facilityById.get(event.outOfActionFacilityId)?.name ?? 'a facility'} out of action next turn`
        : null,
      event.storageItem ? `stored: ${event.storageItem}` : null,
      event.note || null,
    ].filter(Boolean);
    lines.push(
      `${who} rolled ${event.roll}: ${name}${outcome.length ? ` (${outcome.join(', ')})` : ''}.`,
    );
  }

  if (context.treasuryGold + treasuryDelta < 0) {
    problems.push(
      `The treasury holds ${context.treasuryGold} gp; this turn needs ${-treasuryDelta} gp more than it brings in.`,
    );
  }

  if (problems.length) return { ok: false, problems };

  const projects = context.bastions.flatMap(bastion => [
    ...bastion.projectsFinishing.map(project => ({
      ...project,
      finishes: true,
      daysLeftAfter: 0,
    })),
    ...bastion.projectsContinuing.map(project => ({
      ...project,
      finishes: false,
    })),
  ]);
  projects
    .filter(project => project.finishes)
    .forEach(project => lines.push(`Finished: ${project.description}.`));

  // Where each bastion stands once it is all applied, so the log can be read
  // on its own later.
  context.bastions.forEach(bastion => {
    const count = defenders.get(bastion.id) ?? bastion.defenderCount;
    lines.push(
      `${bastion.name} ends the turn with ${count} defender${count === 1 ? '' : 's'}${armory.get(bastion.id) ? ' and a stocked Armory' : ''}.`,
    );
  });

  return {
    ok: true,
    plan: {
      treasuryDelta,
      bastions: context.bastions.map(bastion => ({
        id: bastion.id,
        defenderCount: defenders.get(bastion.id) ?? bastion.defenderCount,
        isArmoryStocked: armory.get(bastion.id) ?? bastion.isArmoryStocked,
        hasGuestMonster:
          guestMonster.get(bastion.id) ?? bastion.hasGuestMonster,
      })),
      facilities: [...facilityState.values()],
      projectsToComplete: projects.filter(p => p.finishes).map(p => p.id),
      projectsToAdvance: projects
        .filter(p => !p.finishes)
        .map(p => ({ id: p.id, daysRemaining: p.daysLeftAfter })),
      storageItems,
      storageItemsToRemove,
      lines,
    },
  };
};
