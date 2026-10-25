'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useInvalidateBastions } from '~/hooks/useInvalidateBastions';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import {
  turnSteps,
  type TurnDraft,
  type TurnEvent,
  type TurnFacilityOrder,
  type TurnStep,
} from '~/server/trpc/schemas/bastionTurns';
import {
  eventForRoll,
  isMaintaining,
  resolveEventOutcome,
} from '~/utils/bastionTurn';

export const stepAfter = (step: TurnStep): TurnStep =>
  turnSteps[Math.min(turnSteps.indexOf(step) + 1, turnSteps.length - 1)]!;

export const stepBefore = (step: TurnStep): TurnStep =>
  turnSteps[Math.max(turnSteps.indexOf(step) - 1, 0)]!;

/** Where a step sits in the stepper: behind the wizard, under it, or ahead. */
export const stepState = (
  step: TurnStep,
  current: TurnStep,
): 'done' | 'current' | 'todo' => {
  if (step === current) return 'current';
  if (turnSteps.indexOf(step) < turnSteps.indexOf(current)) return 'done';

  return 'todo';
};

/**
 * Keeps the events in step with who is maintaining: anyone who now gives
 * orders loses their rolls; anyone who now maintains gets an empty one to
 * fill in. Run whenever presence or Maintain changes.
 */
export const syncEventsWithActors = (draft: TurnDraft): TurnDraft => {
  const maintaining = draft.actors.filter(isMaintaining);
  const isFor = (event: TurnEvent, actor: TurnDraft['actors'][number]) =>
    event.bastionId === actor.bastionId &&
    event.characterId === actor.characterId;

  const kept = draft.events.filter(event =>
    maintaining.some(actor => isFor(event, actor)),
  );
  const missing = maintaining
    .filter(actor => !kept.some(event => isFor(event, actor)))
    .map(actor => blankEvent(actor.bastionId, actor.characterId));

  return { ...draft, events: [...kept, ...missing] };
};

/** An event still waiting for its d100 — roll 0 is "not rolled yet". */
export const blankEvent = (
  bastionId: string,
  characterId: string,
): TurnEvent => ({
  bastionId,
  characterId,
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
});

export const isRolled = (event: Pick<TurnEvent, 'roll'>): boolean =>
  event.roll >= 1 && event.roll <= 100;

/**
 * An event after its d100 or its own dice changed: which event it is, and
 * what it comes to (`resolveEventOutcome`). Changing the d100 to a different
 * event clears that event's dice and choices.
 */
export const updateEvent = (
  event: TurnEvent,
  change: Partial<
    Pick<
      TurnEvent,
      'roll' | 'inputs' | 'outOfActionFacilityId' | 'storageItem' | 'note'
    >
  >,
  bastion: { defenderCount: number; hasGuestMonster: boolean },
): TurnEvent => {
  const roll = change.roll ?? event.roll;
  const key = isRolled({ roll }) ? eventForRoll(roll).key : event.key;
  const isNewEvent = key !== event.key;
  const inputs = isNewEvent ? {} : (change.inputs ?? event.inputs);
  // Null is a real choice here ("Choose a facility" un-picks one), so it is
  // told apart from "not part of this change" by the key being there at all.
  const outOfActionFacilityId =
    change.outOfActionFacilityId !== undefined
      ? change.outOfActionFacilityId
      : event.outOfActionFacilityId;

  return {
    ...event,
    ...change,
    roll,
    key,
    inputs,
    outOfActionFacilityId: isNewEvent ? null : outOfActionFacilityId,
    storageItem: isNewEvent ? '' : (change.storageItem ?? event.storageItem),
    ...resolveEventOutcome(key, inputs, bastion),
  };
};

/**
 * Puts a changed event back in the list. An Extraordinary Opportunity that
 * was paid for is followed by the event it bought; once it is declined, or
 * its d100 changed to something else, those follow-ups were never rolled for
 * and go with it, rather than staying behind to be rolled and applied.
 */
export const replaceEvent = (
  events: ReadonlyArray<TurnEvent>,
  index: number,
  next: TurnEvent,
): Array<TurnEvent> => {
  const keepsFollowUps =
    next.key === 'extraordinary-opportunity' && next.inputs.accept === 1;
  const firstOther = events.findIndex(
    (event, at) =>
      at > index &&
      (event.bastionId !== next.bastionId ||
        event.characterId !== next.characterId),
  );
  const followUpsEnd = firstOther === -1 ? events.length : firstOther;

  return [
    ...events.slice(0, index),
    next,
    ...(keepsFollowUps ? events.slice(index + 1, followUpsEnd) : []),
    ...events.slice(followUpsEnd),
  ];
};

/** The order a facility has this turn, and who gave it — or null. */
export const findFacilityOrder = (draft: TurnDraft, facilityId: string) => {
  for (const actor of draft.actors) {
    const order = actor.facilityOrders.find(o => o.facilityId === facilityId);
    if (order) return { characterId: actor.characterId, order };
  }
  return null;
};

/**
 * Gives a facility its one order for the turn, from whichever member at home
 * the DM picks — clearing any order someone else had given it. Null clears
 * it, leaving the facility idle.
 */
export const setFacilityOrder = (
  draft: TurnDraft,
  bastionId: string,
  facilityId: string,
  order: { characterId: string; order: TurnFacilityOrder } | null,
): TurnDraft => ({
  ...draft,
  actors: draft.actors.map(actor => {
    if (actor.bastionId !== bastionId) return actor;

    const others = actor.facilityOrders.filter(
      o => o.facilityId !== facilityId,
    );
    return {
      ...actor,
      facilityOrders:
        order && order.characterId === actor.characterId
          ? [...others, order.order]
          : others,
    };
  }),
});

/**
 * Why the wizard cannot move past this step yet, or null when it can. The
 * server checks again on commit; this is so the DM is told at the step that
 * needs fixing, not at the end.
 */
export const stepBlocker = (draft: TurnDraft): string | null => {
  if (draft.step !== 'events') return null;

  const unrolled = draft.events.filter(event => !isRolled(event));
  return unrolled.length
    ? `${unrolled.length} Bastion Event${unrolled.length === 1 ? '' : 's'} still to roll.`
    : null;
};

export const useBastionTurn = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const current = useQuery(trpc.bastionTurns.current.queryOptions());
  const history = useQuery(trpc.bastionTurns.history.queryOptions());

  const invalidateBastions = useInvalidateBastions();

  const invalidateTurn = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.bastionTurns.current.queryKey(),
    });

  const invalidateEverything = () =>
    Promise.all([
      invalidateBastions(),
      queryClient.invalidateQueries({
        queryKey: trpc.bastionTurns.history.queryKey(),
      }),
    ]);

  const start = useMutation(
    trpc.bastionTurns.start.mutationOptions({ onSuccess: invalidateTurn }),
  );
  const save = useMutation(trpc.bastionTurns.saveDraft.mutationOptions());
  const preview = useMutation(trpc.bastionTurns.preview.mutationOptions());
  const discard = useMutation(
    trpc.bastionTurns.discard.mutationOptions({ onSuccess: invalidateTurn }),
  );
  const commit = useMutation(
    trpc.bastionTurns.commit.mutationOptions({
      onSuccess: invalidateEverything,
    }),
  );

  const turn = current.data?.turn ?? null;

  return {
    isPending: current.isPending,
    turn,
    context: (current.data?.context ?? null) as TurnContext | null,
    history: history.data ?? [],
    isSaving:
      start.isPending ||
      save.isPending ||
      discard.isPending ||
      commit.isPending,
    error:
      commit.error?.message ??
      save.error?.message ??
      start.error?.message ??
      null,
    preview: preview.data ?? null,
    isPreviewing: preview.isPending,
    start: () => start.mutateAsync(),
    save: async (draft: TurnDraft) => {
      if (!turn) return null;

      const saved = await save.mutateAsync({ id: turn.id, draft });
      // Saving changes nothing but the draft, so it is written into the cache
      // rather than reloading the whole turn context after every step.
      queryClient.setQueryData(trpc.bastionTurns.current.queryKey(), old =>
        old?.turn ? { ...old, turn: { ...old.turn, draft } } : old,
      );

      return saved;
    },
    requestPreview: (draft: TurnDraft) =>
      turn ? preview.mutate({ id: turn.id, draft }) : undefined,
    discard: () => (turn ? discard.mutate({ id: turn.id }) : undefined),
    commit: () =>
      turn ? commit.mutateAsync({ id: turn.id }) : Promise.resolve(null),
  };
};
